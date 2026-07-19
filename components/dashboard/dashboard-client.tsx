'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Users, Package, AlertCircle, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DashboardStats } from '@/lib/types';
import { formatCurrency, formatCompactCurrency, timeAgo } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  delay: number;
}

function StatCard({ title, value, change, trend, icon, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="glass hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
            {change && (
              <Badge variant={trend === 'up' ? 'default' : 'destructive'} className="gap-1">
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {change}
              </Badge>
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [
        { data: todaySales }, { data: yesterdaySales }, { data: monthSales }, { data: lastMonthSales },
        { data: monthExpenses }, { data: lastMonthExpenses },
        { data: outstanding }, { data: customers }, { data: lastMonthCustomers }, { data: products },
        { data: lowStockProducts },
        { data: topProductsData }, { data: latestOrders }, { data: revenueRaw },
        { data: expenseRaw }, { data: categorySales },
      ] = await Promise.all([
        supabase.from('sales').select('total_amount').gte('sale_date', todayStart).eq('status', 'paid'),
        supabase.from('sales').select('total_amount').gte('sale_date', yesterdayStart).lt('sale_date', todayStart).eq('status', 'paid'),
        supabase.from('sales').select('total_amount').gte('sale_date', monthStart).eq('status', 'paid'),
        supabase.from('sales').select('total_amount').gte('sale_date', lastMonthStart).lt('sale_date', monthStart).eq('status', 'paid'),
        supabase.from('expenses').select('amount').gte('expense_date', monthStart.slice(0, 10)),
        supabase.from('expenses').select('amount').gte('expense_date', lastMonthStart.slice(0, 10)).lt('expense_date', monthStart.slice(0, 10)),
        supabase.from('sales').select('total_amount,paid_amount').eq('status', 'pending'),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('customers').select('id').lt('created_at', monthStart),
        supabase.from('products').select('cost_price,stock_quantity'),
        supabase.from('products').select('id').filter('stock_quantity', 'lt', 'min_stock_level').is('deleted_at', null),
        supabase.from('sale_items').select('product_name,quantity,subtotal').gte('created_at', monthStart).order('quantity', { ascending: false }).limit(50),
        supabase.from('sales').select('*,customer:customers(*)').order('sale_date', { ascending: false }).limit(8),
        supabase.from('sales').select('sale_date,total_amount').gte('sale_date', thirtyDaysAgo).order('sale_date', { ascending: true }),
        supabase.from('expenses').select('expense_date,amount').gte('expense_date', thirtyDaysAgo.slice(0, 10)).order('expense_date', { ascending: true }),
        supabase.from('sale_items').select('subtotal,product:products(category:categories(name))').gte('created_at', monthStart),
      ]);

      const todaySalesTotal = (todaySales || []).reduce((s, r: any) => s + Number(r.total_amount), 0);
      const yesterdaySalesTotal = (yesterdaySales || []).reduce((s, r: any) => s + Number(r.total_amount), 0);
      const monthSalesTotal = (monthSales || []).reduce((s, r: any) => s + Number(r.total_amount), 0);
      const lastMonthSalesTotal = (lastMonthSales || []).reduce((s, r: any) => s + Number(r.total_amount), 0);
      const monthExpensesTotal = (monthExpenses || []).reduce((s, r: any) => s + Number(r.amount), 0);
      const lastMonthExpensesTotal = (lastMonthExpenses || []).reduce((s, r: any) => s + Number(r.amount), 0);
      const outstandingTotal = (outstanding || []).reduce((s, r: any) => s + (Number(r.total_amount) - Number(r.paid_amount)), 0);
      const stockValue = (products || []).reduce((s, r: any) => s + Number(r.cost_price) * Number(r.stock_quantity), 0);
      const lowStockCount = lowStockProducts?.length || 0;
      const lastMonthProfit = lastMonthSalesTotal - lastMonthExpensesTotal;
      const thisMonthProfit = monthSalesTotal - monthExpensesTotal;

      const pct = (curr: number, prev: number): { change: string; trend: 'up' | 'down' } => {
        if (prev === 0) return { change: curr > 0 ? '+∞' : '0%', trend: curr > 0 ? 'up' : 'down' };
        const diff = ((curr - prev) / Math.abs(prev)) * 100;
        const sign = diff >= 0 ? '+' : '';
        return { change: `${sign}${diff.toFixed(1)}%`, trend: diff >= 0 ? 'up' : 'down' };
      };
      const todayPct = pct(todaySalesTotal, yesterdaySalesTotal);
      const monthSalesPct = pct(monthSalesTotal, lastMonthSalesTotal);
      const expensesPct = pct(monthExpensesTotal, lastMonthExpensesTotal);
      const profitPct = pct(thisMonthProfit, lastMonthProfit);
      const customerPct = pct(customers?.length || 0, lastMonthCustomers?.length || 0);

      const productMap = new Map<string, { quantity: number; revenue: number }>();
      (topProductsData || []).forEach((item: any) => {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        existing.quantity += Number(item.quantity);
        existing.revenue += Number(item.subtotal);
        productMap.set(item.product_name, existing);
      });
      const topProducts = Array.from(productMap.entries()).map(([name, v]) => ({ name, quantity: v.quantity, revenue: v.revenue })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

      const dateMap = new Map<string, { revenue: number; expenses: number }>();
      (revenueRaw || []).forEach((r: any) => {
        const day = new Date(r.sale_date).toISOString().slice(0, 10);
        const ex = dateMap.get(day) || { revenue: 0, expenses: 0 };
        ex.revenue += Number(r.total_amount);
        dateMap.set(day, ex);
      });
      (expenseRaw || []).forEach((r: any) => {
        const day = r.expense_date;
        const ex = dateMap.get(day) || { revenue: 0, expenses: 0 };
        ex.expenses += Number(r.amount);
        dateMap.set(day, ex);
      });
      const revenueData = Array.from(dateMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date: new Date(date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }), revenue: Math.round(v.revenue), expenses: Math.round(v.expenses), profit: Math.round(v.revenue - v.expenses) }));

      const catMap = new Map<string, number>();
      (categorySales || []).forEach((r: any) => {
        const catName = r?.product?.category?.name || 'Kategorisiz';
        catMap.set(catName, (catMap.get(catName) || 0) + Number(r.subtotal));
      });
      const salesByCategory = Array.from(catMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
      const cashFlowData = revenueData.map((d) => ({ date: d.date, inflow: d.revenue, outflow: d.expenses }));

      setStats({
        todaySales: todaySalesTotal, monthlySales: monthSalesTotal, expenses: monthExpensesTotal,
        profit: thisMonthProfit, outstandingPayments: outstandingTotal,
        customerCount: customers?.length || 0, stockValue, topProducts,
        latestOrders: (latestOrders || []) as any, revenueData, salesByCategory, cashFlowData,
        lowStockCount, todayPct, monthSalesPct, expensesPct, profitPct, customerPct,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h2 className="text-2xl font-bold tracking-tight">Tekrar hoş geldiniz, Yönetici</h2>
        <p className="text-sm text-muted-foreground">İşletmenizde bugün neler olduğunu görün.</p>
      </motion.div>

      {/* İstatistik kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bugünkü Satışlar" value={formatCurrency(stats.todaySales)} change={stats.todayPct.change} trend={stats.todayPct.trend} icon={<DollarSign className="h-5 w-5" />} delay={0} />
        <StatCard title="Aylık Satışlar" value={formatCurrency(stats.monthlySales)} change={stats.monthSalesPct.change} trend={stats.monthSalesPct.trend} icon={<TrendingUp className="h-5 w-5" />} delay={0.05} />
        <StatCard title="Giderler" value={formatCurrency(stats.expenses)} change={stats.expensesPct.change} trend={stats.expensesPct.trend} icon={<TrendingDown className="h-5 w-5" />} delay={0.1} />
        <StatCard title="Kâr" value={formatCurrency(stats.profit)} change={stats.profitPct.change} trend={stats.profitPct.trend} icon={<Wallet className="h-5 w-5" />} delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bekleyen Ödemeler" value={formatCurrency(stats.outstandingPayments)} icon={<AlertCircle className="h-5 w-5" />} delay={0.2} />
        <StatCard title="Müşteri Sayısı" value={stats.customerCount.toString()} change={stats.customerPct.change} trend={stats.customerPct.trend} icon={<Users className="h-5 w-5" />} delay={0.25} />
        <StatCard title="Stok Değeri" value={formatCompactCurrency(stats.stockValue)} icon={<Package className="h-5 w-5" />} delay={0.3} />
        <StatCard title="Düşük Stok" value={stats.lowStockCount.toString()} change="İşlem gerekli" trend="down" icon={<AlertCircle className="h-5 w-5" />} delay={0.35} />
      </div>

      {/* Grafikler */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="glass h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Gelir Özeti</CardTitle>
                <p className="text-sm text-muted-foreground">Gelir, gider ve kâr (son 30 gün)</p>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                  <Area type="monotone" dataKey="revenue" name="Gelir" stroke="hsl(var(--chart-1))" fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" name="Gider" stroke="hsl(var(--chart-5))" fill="url(#colorExpenses)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Kâr" stroke="hsl(var(--chart-2))" fill="url(#colorProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="text-base">Kategoriye Göre Satış</CardTitle>
              <p className="text-sm text-muted-foreground">Bu ayki dağılım</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.salesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {stats.salesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Nakit Akışı + En Çok Satanlar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="text-base">Nakit Akışı</CardTitle>
              <p className="text-sm text-muted-foreground">Giriş ve çıkış</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                  <Bar dataKey="inflow" name="Giriş" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" name="Çıkış" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="text-base">En Çok Satan Ürünler</CardTitle>
              <p className="text-sm text-muted-foreground">Bu ay satış adedine göre</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                  />
                  <Bar dataKey="quantity" name="Adet" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Son Siparişler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.4 }}
      >
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">Son Siparişler</CardTitle>
            <p className="text-sm text-muted-foreground">Son satış işlemleri</p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.latestOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.invoice_number}</TableCell>
                    <TableCell>{order.customer?.name || 'Yoldaki Müşteri'}</TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(order.sale_date)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'paid' ? 'default' : 'destructive'}>
                        {order.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(order.total_amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
