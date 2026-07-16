'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Users, Package, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { DashboardStats } from '@/lib/types';
import { formatCurrency, formatCompactCurrency, timeAgo } from '@/lib/format';

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

export function DashboardClient({ stats }: { stats: DashboardStats }) {
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
        <StatCard title="Bugünkü Satışlar" value={formatCurrency(stats.todaySales)} change="+12.5%" trend="up" icon={<DollarSign className="h-5 w-5" />} delay={0} />
        <StatCard title="Aylık Satışlar" value={formatCurrency(stats.monthlySales)} change="+8.2%" trend="up" icon={<TrendingUp className="h-5 w-5" />} delay={0.05} />
        <StatCard title="Giderler" value={formatCurrency(stats.expenses)} change="-3.1%" trend="down" icon={<TrendingDown className="h-5 w-5" />} delay={0.1} />
        <StatCard title="Kâr" value={formatCurrency(stats.profit)} change="+15.7%" trend="up" icon={<Wallet className="h-5 w-5" />} delay={0.15} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bekleyen Ödemeler" value={formatCurrency(stats.outstandingPayments)} icon={<AlertCircle className="h-5 w-5" />} delay={0.2} />
        <StatCard title="Müşteri Sayısı" value={stats.customerCount.toString()} change="+4" trend="up" icon={<Users className="h-5 w-5" />} delay={0.25} />
        <StatCard title="Stok Değeri" value={formatCompactCurrency(stats.stockValue)} icon={<Package className="h-5 w-5" />} delay={0.3} />
        <StatCard title="Düşük Stok" value="3" change="İşlem gerekli" trend="down" icon={<AlertCircle className="h-5 w-5" />} delay={0.35} />
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
