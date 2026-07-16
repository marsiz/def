'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, CreditCard, TrendingDown } from 'lucide-react';
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
import type { Expense } from '@/lib/types';

const EXPENSE_CATEGORIES = ['Kira', 'Faturalar', 'Maaşlar', 'Stok', 'Pazarlama', 'Ekipman', 'Diğer', 'Ulaşım', 'Sigorta', 'Vergiler'];

interface ExpenseForm {
  id?: string;
  category: string;
  description: string;
  amount: string;
  expense_date: string;
  payment_method: string;
  reference: string;
}

const emptyForm: ExpenseForm = {
  category: '',
  description: '',
  amount: '0',
  expense_date: new Date().toISOString().slice(0, 10),
  payment_method: 'cash',
  reference: '',
};

export function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalAmount = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editing.category || !editing.amount) return;
    setSaving(true);
    const payload = {
      category: editing.category,
      description: editing.description || null,
      amount: parseFloat(editing.amount) || 0,
      expense_date: editing.expense_date,
      payment_method: editing.payment_method,
      reference: editing.reference || null,
    };
    if (editing.id) {
      const { data } = await supabase.from('expenses').update(payload).eq('id', editing.id).select().single();
      if (data) setExpenses((prev) => prev.map((e) => (e.id === data.id ? data : e)));
    } else {
      const { data } = await supabase.from('expenses').insert(payload).select().single();
      if (data) setExpenses((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gider Yönetimi"
        description="İşletme giderlerini takip edin ve yönetin"
        actionLabel="Gider Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Giderler</p>
                <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Bu Ay</p>
            <p className="text-xl font-bold">{formatCurrency(expenses.filter(e => new Date(e.expense_date).getMonth() === new Date().getMonth()).reduce((s, e) => s + Number(e.amount), 0))}</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Kategoriler</p>
            <p className="text-xl font-bold">{new Set(expenses.map(e => e.category)).size}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Giderlerde ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-8 w-8" />}
              title="Gider bulunamadı"
              description={search ? "Aramanızı değiştirmeyi deneyin" : "İlk gider kaydınızı ekleyin"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Gider Ekle</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ödeme</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((e, i) => (
                    <motion.tr key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                      <TableCell><Badge variant="secondary">{e.category}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{e.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(e.expense_date)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.payment_method === 'cash' ? 'Nakit' : e.payment_method === 'card' ? 'Kart' : 'Havale'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">-{formatCurrency(Number(e.amount))}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Gider Düzenle' : 'Yeni Gider'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tutar (₺) *</Label>
                <Input type="number" step="0.01" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input type="date" value={editing.expense_date} onChange={(e) => setEditing({ ...editing, expense_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ödeme Yöntemi</Label>
                <Select value={editing.payment_method} onValueChange={(v) => setEditing({ ...editing, payment_method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="card">Kart</SelectItem>
                    <SelectItem value="bank">Havale/EFT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="Gider açıklaması" />
            </div>
            <div className="space-y-2">
              <Label>Referans</Label>
              <Input value={editing.reference} onChange={(e) => setEditing({ ...editing, reference: e.target.value })} placeholder="Makbuz veya referans numarası" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !editing.category}>
              {saving ? 'Kaydediliyor...' : editing.id ? 'Güncelle' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Gideri Sil"
        description="Bu gider kaydını silmek istediğinizden emin misiniz?"
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
