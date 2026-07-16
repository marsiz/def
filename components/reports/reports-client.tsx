'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const chartData = useMemo(() => {
    const map = new Map<string, { sales: number; expenses: number }>();
    filteredSales.forEach((s) => {
      const day = new Date(s.sale_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
      const existing = map.get(day) || { sales: 0, expenses: 0 };
      existing.sales += Number(s.total_amount);
      map.set(day, existing);
    });
    filteredExpenses.forEach((e) => {
      const day = new Date(e.expense_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
      const existing = map.get(day) || { sales: 0, expenses: 0 };
      existing.expenses += Number(e.amount);
      map.set(day, existing);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({ date, sales: Math.round(v.sales), expenses: Math.round(v.expenses), profit: Math.round(v.sales - v.expenses) }));
  }, [filteredSales, filteredExpenses]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + Number(e.amount)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [filteredExpenses]);

  const stockData = useMemo(() => {
    return products
      .map((p) => ({ name: p.name, value: Number(p.cost_price) * p.stock_quantity, stock: p.stock_quantity }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [products]);

  return (
    <div className="space-y-6">
      <PageHeader title="Raporlar ve Analiz" description="Kapsamlı işletme analizleri ve raporlama" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-full sm:w-40">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Günlük</SelectItem>
            <SelectItem value="weekly">Haftalık</SelectItem>
            <SelectItem value="monthly">Aylık</SelectItem>
            <SelectItem value="yearly">Yıllık</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">Satış Raporu</SelectItem>
            <SelectItem value="expenses">Gider Raporu</SelectItem>
            <SelectItem value="profit">Kâr Raporu</SelectItem>
            <SelectItem value="stock">Stok Raporu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Toplam Satış', value: formatCurrency(totalSales), icon: <TrendingUp className="h-5 w-5" />, color: 'text-success' },
          { label: 'Toplam Gider', value: formatCurrency(totalExpenses), icon: <TrendingDown className="h-5 w-5" />, color: 'text-destructive' },
          { label: 'Net Kâr', value: formatCurrency(totalProfit), icon: <DollarSign className="h-5 w-5" />, color: totalProfit >= 0 ? 'text-success' : 'text-destructive' },
          { label: 'Ort. Satış', value: formatCurrency(avgSale), icon: <Package className="h-5 w-5" />, color: 'text-primary' },
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
            <CardTitle className="text-base">{reportType === 'sales' ? 'Satış Trendi' : 'Kâr Analizi'}</CardTitle>
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
                <Area type="monotone" dataKey="sales" name="Satış" stroke="hsl(var(--chart-1))" fill="url(#rptSales)" strokeWidth={2} />
                {reportType === 'profit' && <Area type="monotone" dataKey="profit" name="Kâr" stroke="hsl(var(--chart-2))" fill="url(#rptProfit)" strokeWidth={2} />}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {reportType === 'expenses' && (
          <>
            <Card className="glass">
              <CardHeader><CardTitle className="text-base">Gider Dağılımı</CardTitle></CardHeader>
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
              <CardHeader><CardTitle className="text-base">Gider Trendi</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="expenses" name="Gider" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === 'stock' && (
          <Card className="glass lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Ürüne Göre Stok Değeri</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stockData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" name="Değer" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {reportType === 'sales' && (
          <Card className="glass lg:col-span-2">
            <CardHeader><CardTitle className="text-base">Son İşlemler</CardTitle></CardHeader>
            <CardContent className="p-0">
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
                  {filteredSales.slice(0, 10).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.invoice_number}</TableCell>
                      <TableCell>{s.customer?.name || 'Yoldaki'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(s.sale_date)}</TableCell>
                      <TableCell><Badge variant={s.status === 'paid' ? 'default' : 'destructive'}>{s.status === 'paid' ? 'Ödendi' : 'Bekliyor'}</Badge></TableCell>
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
