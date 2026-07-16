'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Banknote, ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
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
import type { CashTransaction } from '@/lib/types';

interface CashForm {
  id?: string;
  transaction_type: string;
  amount: string;
  description: string;
  reference: string;
}

const emptyForm: CashForm = {
  transaction_type: 'in',
  amount: '0',
  description: '',
  reference: '',
};

export function CashRegisterClient() {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CashForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  useEffect(() => {
    supabase
      .from('cash_register')
      .select('*')
      .is('deleted_at', null)
      .order('transaction_date', { ascending: false })
      .then(({ data }) => {
        if (data) setTransactions(data as CashTransaction[]);
      });
  }, []);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      (t.reference || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalIn = transactions.filter((t) => t.transaction_type === 'in').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = transactions.filter((t) => t.transaction_type === 'out').reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIn - totalOut;

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const handleSave = async () => {
    if (!editing.transaction_type || !editing.amount) return;
    setSaving(true);
    const payload = {
      transaction_type: editing.transaction_type,
      amount: parseFloat(editing.amount) || 0,
      description: editing.description || null,
      reference: editing.reference || null,
      transaction_date: new Date().toISOString().slice(0, 10),
    };
    if (editing.id) {
      const { data } = await supabase.from('cash_register').update(payload).eq('id', editing.id).select().single();
      if (data) setTransactions((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } else {
      const { data } = await supabase.from('cash_register').insert(payload).select().single();
      if (data) setTransactions((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('cash_register').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kasa"
        description="Nakit giriş ve çıkış hareketlerini takip edin"
        actionLabel="Kasa Hareketi Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Güncel Bakiye</p>
                <p className="text-xl font-bold">{formatCurrency(balance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <ArrowDownCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Giriş</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totalIn)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <ArrowUpCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Çıkış</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalOut)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Hareketlerde ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Hareketler</SelectItem>
            <SelectItem value="in">Giriş</SelectItem>
            <SelectItem value="out">Çıkış</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Banknote className="h-8 w-8" />}
              title="Kasa hareketi bulunamadı"
              description={search ? "Aramanızı değiştirmeyi deneyin" : "İlk kasa hareketinizi ekleyin"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Kasa Hareketi Ekle</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tip</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Referans</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((t, i) => (
                    <motion.tr key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                      <TableCell>
                        <Badge variant={t.transaction_type === 'in' ? 'default' : 'destructive'}>
                          {t.transaction_type === 'in' ? 'Giriş' : 'Çıkış'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${t.transaction_type === 'in' ? 'text-success' : 'text-destructive'}`}>
                        {t.transaction_type === 'in' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.description || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{t.reference || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(t.transaction_date)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
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
            <DialogTitle>{editing.id ? 'Kasa Hareketi Düzenle' : 'Kasa Hareketi Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hareket Tipi *</Label>
                <Select value={editing.transaction_type} onValueChange={(v) => setEditing({ ...editing, transaction_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Giriş</SelectItem>
                    <SelectItem value="out">Çıkış</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tutar (₺) *</Label>
                <Input type="number" step="0.01" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="Hareket açıklaması" />
            </div>
            <div className="space-y-2">
              <Label>Referans</Label>
              <Input value={editing.reference} onChange={(e) => setEditing({ ...editing, reference: e.target.value })} placeholder="Referans numarası" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !editing.transaction_type}>
              {saving ? 'Kaydediliyor...' : editing.id ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Kasa Hareketini Sil"
        description="Bu kasa hareketini silmek istediğinizden emin misiniz?"
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
