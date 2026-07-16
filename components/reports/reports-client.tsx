'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { formatCurrency, formatCompactCurrency, formatDate } from '@/lib/format';
import type { Sale, Expense, Product, Customer } from '@/lib/types';

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface ReportsClientProps {
  sales: (Sale & { customer?: Customer | null })[];
  expenses: Expense[];
  products: Product[];
}

export function ReportsClient({ sales, expenses, products }: ReportsClientProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [reportType, setReportType] = useState<'sales' | 'expenses' | 'profit' | 'stock'>('sales');

  const filteredSales = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(now);
    switch (period) {
      case 'daily': cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'weekly': cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'monthly': cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case 'yearly': cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    }
    return sales.filter((s) => new Date(s.sale_date) >= cutoff);
  }, [sales, period]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(now);
    switch (period) {
      case 'daily': cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case 'weekly': cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'monthly': cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case 'yearly': cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
    }
    return expenses.filter((e) => new Date(e.expense_date) >= cutoff);
  }, [expenses, period]);

  const totalSales = filteredSales.reduce((s, r) => s + Number(r.total_amount), 0);
  const totalExpenses = filteredExpenses.reduce((s, r) => s + Number(r.amount), 0);
  const totalProfit = totalSales - totalExpenses;
  const avgSale = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  // Chart data by date
  const chartData = useMemo(() => {
    const map = new Map<string, { sales: number; expenses: number }>();
    filteredSales.forEach((s) => {
      const day = new Date(s.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = map.get(day) || { sales: 0, expenses: 0 };
      existing.sales += Number(s.total_amount);
      map.set(day, existing);
    });
    filteredExpenses.forEach((e) => {
      const day = new Date(e.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = map.get(day) || { sales: 0, expenses: 0 };
      existing.expenses += Number(e.amount);
      map.set(day, existing);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, sales: Math.round(v.sales), expenses: Math.round(v.expenses), profit: Math.round(v.sales - v.expenses) }));
  }, [filteredSales, filteredExpenses]);

  // Expense breakdown
  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + Number(e.amount)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [filteredExpenses]);

  // Stock value by product
  const stockData = useMemo(() => {
    return products
      .map((p) => ({ name: p.name, value: Number(p.cost_price) * p.stock_quantity, stock: p.stock_quantity }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [products]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Comprehensive business insights and reporting" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-full sm:w-40">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Sales Report</SelectItem>
            <SelectItem value="expenses">Expense Report</SelectItem>
            <SelectItem value="profit">Profit Report</SelectItem>
            <SelectItem value="stock">Stock Report</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Sales', value: formatCurrency(totalSales), icon: <TrendingUp className="h-5 w-5" />, color: 'text-success' },
          { label: 'Total Expenses', value: formatCurrency(totalExpenses), icon: <TrendingDown className="h-5 w-5" />, color: 'text-destructive' },
          { label: 'Net Profit', value: formatCurrency(totalProfit), icon: <DollarSign className="h-5 w-5" />, color: totalProfit >= 0 ? 'text-success' : 'text-destructive' },
          { label: 'Avg Sale Value', value: formatCurrency(avgSale), icon: <Package className="h-5 w-5" />, color: 'text-primary' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
                <p className="mt-2 text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {(reportType === 'sales' || reportType === 'profit') && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">{reportType === 'sales' ? 'Sales Trend' : 'Profit Analysis'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rptSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rptProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--chart-1))" fill="url(#rptSales)" strokeWidth={2} />
                {reportType === 'profit' && <Area type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" fill="url(#rptProfit)" strokeWidth={2} />}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {reportType === 'expenses' && (
          <>
            <Card className="glass">
              <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader><CardTitle className="text-base">Expense Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="expenses" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === 'stock' && (
          <Card className="glass lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Stock Value by Product</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stockData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {reportType === 'sales' && (
          <Card className="glass lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.slice(0, 10).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.invoice_number}</TableCell>
                      <TableCell>{s.customer?.name || 'Walk-in'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(s.sale_date)}</TableCell>
                      <TableCell><Badge variant={s.status === 'paid' ? 'default' : 'destructive'}>{s.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(s.total_amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
