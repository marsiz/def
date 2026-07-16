'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, CalendarClock, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Installment, Customer } from '@/lib/types';

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  completed: 'Tamamlandı',
  overdue: 'Gecikti',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  overdue: 'destructive',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <Clock className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  overdue: <AlertCircle className="h-3.5 w-3.5" />,
};

interface InstallmentForm {
  id?: string;
  customer_id: string;
  total_amount: string;
  installment_count: string;
  monthly_amount: string;
  next_payment_date: string;
  notes: string;
}

const emptyForm: InstallmentForm = {
  customer_id: '',
  total_amount: '0',
  installment_count: '1',
  monthly_amount: '0',
  next_payment_date: new Date().toISOString().slice(0, 10),
  notes: '',
};

export function InstallmentsClient({
  initialInstallments,
  customers,
}: {
  initialInstallments: (Installment & { customer?: Customer | null })[];
  customers: Customer[];
}) {
  const [installments, setInstallments] = useState(initialInstallments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InstallmentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  const filtered = installments.filter((inst) => {
    const matchesSearch =
      (inst.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (inst.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = installments.reduce((sum, i) => sum + Number(i.total_amount), 0);
  const totalPaid = installments.reduce((sum, i) => sum + Number(i.paid_amount), 0);
  const activeCount = installments.filter((i) => i.status === 'active').length;

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  // Auto-calculate monthly amount when total or count changes
  const updateTotalOrCount = (field: 'total_amount' | 'installment_count', value: string) => {
    const next = { ...editing, [field]: value };
    const total = parseFloat(next.total_amount) || 0;
    const count = parseInt(next.installment_count) || 1;
    next.monthly_amount = count > 0 ? (total / count).toFixed(2) : '0';
    setEditing(next);
  };

  const handleSave = async () => {
    if (!editing.customer_id || !editing.total_amount) return;
    setSaving(true);
    const payload = {
      customer_id: editing.customer_id,
      total_amount: parseFloat(editing.total_amount) || 0,
      paid_amount: 0,
      installment_count: parseInt(editing.installment_count) || 1,
      monthly_amount: parseFloat(editing.monthly_amount) || 0,
      next_payment_date: editing.next_payment_date || null,
      status: 'active',
      notes: editing.notes || null,
    };
    if (editing.id) {
      const { data } = await supabase.from('installments').update(payload).eq('id', editing.id).select().single();
      if (data) setInstallments((prev) => prev.map((i) => (i.id === data.id ? data : i)));
    } else {
      const { data } = await supabase.from('installments').insert(payload).select('*,customer:customers(*)').single();
      if (data) setInstallments((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('installments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setInstallments((prev) => prev.filter((i) => i.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taksitler"
        description="Taksitli ödeme planlarını takip edin ve yönetin"
        actionLabel="Taksit Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Tutar</p>
                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ödenen</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktif Taksitler</p>
                <p className="text-xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Müşteri veya not ile ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
            <SelectItem value="overdue">Gecikti</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="h-8 w-8" />}
              title="Taksit bulunamadı"
              description={search ? "Aramanızı değiştirmeyi deneyin" : "İlk taksit planınızı ekleyin"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Taksit Ekle</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead className="text-right">Toplam Tutar</TableHead>
                  <TableHead className="text-right">Ödenen</TableHead>
                  <TableHead className="text-center">Taksit Sayısı</TableHead>
                  <TableHead className="text-right">Aylık Tutar</TableHead>
                  <TableHead>Sonraki Ödeme</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((inst, i) => (
                    <motion.tr key={inst.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                      <TableCell className="font-medium">{inst.customer?.name || '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(inst.total_amount))}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(Number(inst.paid_amount))}</TableCell>
                      <TableCell className="text-center">{inst.installment_count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(inst.monthly_amount))}</TableCell>
                      <TableCell className="text-muted-foreground">{inst.next_payment_date ? formatDate(inst.next_payment_date) : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[inst.status] || 'secondary'} className="gap-1">
                          {STATUS_ICONS[inst.status]}
                          {STATUS_LABELS[inst.status] || inst.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(inst.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Taksit Düzenle' : 'Taksit Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Müşteri *</Label>
              <Select value={editing.customer_id} onValueChange={(v) => setEditing({ ...editing, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Müşteri seçin" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Toplam Tutar (₺) *</Label>
                <Input type="number" step="0.01" value={editing.total_amount} onChange={(e) => updateTotalOrCount('total_amount', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Taksit Sayısı *</Label>
                <Input type="number" min="1" value={editing.installment_count} onChange={(e) => updateTotalOrCount('installment_count', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Aylık Tutar (₺)</Label>
                <Input type="number" step="0.01" value={editing.monthly_amount} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Sonraki Ödeme</Label>
                <Input type="date" value={editing.next_payment_date} onChange={(e) => setEditing({ ...editing, next_payment_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} placeholder="Taksit ile ilgili notlar" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !editing.customer_id}>
              {saving ? 'Kaydediliyor...' : editing.id ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Taksiti Sil"
        description="Bu taksit kaydını silmek istediğinizden emin misiniz?"
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
