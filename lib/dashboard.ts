import { supabase } from '@/lib/supabase';
import type { Sale, Customer, Product, Expense, DashboardStats } from '@/lib/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: todaySales },
    { data: monthSales },
    { data: monthExpenses },
    { data: outstanding },
    { data: customers },
    { data: products },
    { data: topProductsData },
    { data: latestOrders },
    { data: revenueRaw },
    { data: expenseRaw },
    { data: categorySales },
  ] = await Promise.all([
    supabase.from('sales').select('total_amount').gte('sale_date', todayStart).eq('status', 'paid'),
    supabase.from('sales').select('total_amount').gte('sale_date', monthStart).eq('status', 'paid'),
    supabase.from('expenses').select('amount').gte('expense_date', monthStart.slice(0, 10)),
    supabase.from('sales').select('total_amount,paid_amount').eq('status', 'pending'),
    supabase.from('customers').select('id', { count: 'exact', head: false }),
    supabase.from('products').select('cost_price,stock_quantity'),
    supabase
      .from('sale_items')
      .select('product_name,quantity,subtotal')
      .gte('created_at', monthStart)
      .order('quantity', { ascending: false })
      .limit(50),
    supabase
      .from('sales')
      .select('*,customer:customers(*)')
      .order('sale_date', { ascending: false })
      .limit(8),
    supabase
      .from('sales')
      .select('sale_date,total_amount')
      .gte('sale_date', thirtyDaysAgo)
      .order('sale_date', { ascending: true }),
    supabase
      .from('expenses')
      .select('expense_date,amount')
      .gte('expense_date', thirtyDaysAgo.slice(0, 10))
      .order('expense_date', { ascending: true }),
    supabase
      .from('sale_items')
      .select('subtotal,product:products(category:categories(name))')
      .gte('created_at', monthStart),
  ]);

  const todaySalesTotal = (todaySales || []).reduce((s, r) => s + Number(r.total_amount), 0);
  const monthSalesTotal = (monthSales || []).reduce((s, r) => s + Number(r.total_amount), 0);
  const monthExpensesTotal = (monthExpenses || []).reduce((s, r) => s + Number(r.amount), 0);
  const outstandingTotal = (outstanding || []).reduce(
    (s, r) => s + (Number(r.total_amount) - Number(r.paid_amount)),
    0
  );
  const stockValue = (products || []).reduce(
    (s, r) => s + Number(r.cost_price) * Number(r.stock_quantity),
    0
  );

  // En çok satan ürünler
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  (topProductsData || []).forEach((item) => {
    const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
    existing.quantity += Number(item.quantity);
    existing.revenue += Number(item.subtotal);
    productMap.set(item.product_name, existing);
  });
  const topProducts = Array.from(productMap.entries())
    .map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Gelir / Gider / Kar günlük
  const dateMap = new Map<string, { revenue: number; expenses: number }>();
  (revenueRaw || []).forEach((r) => {
    const day = new Date(r.sale_date).toISOString().slice(0, 10);
    const existing = dateMap.get(day) || { revenue: 0, expenses: 0 };
    existing.revenue += Number(r.total_amount);
    dateMap.set(day, existing);
  });
  (expenseRaw || []).forEach((r) => {
    const day = r.expense_date;
    const existing = dateMap.get(day) || { revenue: 0, expenses: 0 };
    existing.expenses += Number(r.amount);
    dateMap.set(day, existing);
  });
  const revenueData = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({
      date: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
      revenue: Math.round(v.revenue),
      expenses: Math.round(v.expenses),
      profit: Math.round(v.revenue - v.expenses),
    }));

  // Kategoriye göre satış
  const catMap = new Map<string, number>();
  (categorySales || []).forEach((r) => {
    const catName = (r as any)?.product?.category?.name || 'Kategorisiz';
    catMap.set(catName, (catMap.get(catName) || 0) + Number((r as any).subtotal));
  });
  const salesByCategory = Array.from(catMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Nakit akışı
  const cashFlowData = revenueData.map((d) => ({
    date: d.date,
    inflow: d.revenue,
    outflow: d.expenses,
  }));

  return {
    todaySales: todaySalesTotal,
    monthlySales: monthSalesTotal,
    expenses: monthExpensesTotal,
    profit: monthSalesTotal - monthExpensesTotal,
    outstandingPayments: outstandingTotal,
    customerCount: customers?.length || 0,
    stockValue,
    topProducts,
    latestOrders: (latestOrders || []) as (Sale & { customer?: Customer | null })[],
    revenueData,
    salesByCategory,
    cashFlowData,
  };
}
