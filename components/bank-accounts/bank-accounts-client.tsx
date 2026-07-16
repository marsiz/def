'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Landmark, Building2, CreditCard, Hash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import type { BankAccount } from '@/lib/types';

interface BankAccountForm {
  id?: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  iban: string;
  balance: string;
  currency: string;
  account_type: string;
}

const emptyForm: BankAccountForm = {
  bank_name: '',
  account_name: '',
  account_number: '',
  iban: '',
  balance: '0',
  currency: 'TRY',
  account_type: 'checking',
};

export function BankAccountsClient() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('bank_accounts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAccounts(data as BankAccount[]);
      });
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  const filtered = accounts.filter(
    (a) =>
      a.bank_name.toLowerCase().includes(search.toLowerCase()) ||
      a.account_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.iban || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const openEdit = (a: BankAccount) => {
    setEditing({
      id: a.id,
      bank_name: a.bank_name,
      account_name: a.account_name,
      account_number: a.account_number || '',
      iban: a.iban || '',
      balance: String(a.balance),
      currency: a.currency,
      account_type: a.account_type,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.bank_name || !editing.account_name) return;
    setSaving(true);
    const payload = {
      bank_name: editing.bank_name,
      account_name: editing.account_name,
      account_number: editing.account_number || null,
      iban: editing.iban || null,
      balance: parseFloat(editing.balance) || 0,
      currency: editing.currency,
      account_type: editing.account_type,
    };
    if (editing.id) {
      const { data } = await supabase.from('bank_accounts').update(payload).eq('id', editing.id).select().single();
      if (data) setAccounts((prev) => prev.map((a) => (a.id === data.id ? data : a)));
    } else {
      const { data } = await supabase.from('bank_accounts').insert(payload).select().single();
      if (data) setAccounts((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('bank_accounts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banka Hesapları"
        description="Banka hesaplarınızı ve bakiyelerinizi yönetin"
        actionLabel="Hesap Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Toplam Bakiye</p>
                <p className="text-xl font-bold">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hesap Sayısı</p>
                <p className="text-xl font-bold">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aktif Hesaplar</p>
                <p className="text-xl font-bold">{accounts.filter((a) => !a.deleted_at).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Banka, hesap adı veya IBAN ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="glass">
          <CardContent>
            <EmptyState
              icon={<Landmark className="h-8 w-8" />}
              title="Banka hesabı bulunamadı"
              description={search ? "Aramanızı değiştirmeyi deneyin" : "İlk banka hesabınızı ekleyin"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Hesap Ekle</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((a, i) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="glass hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                          <Landmark className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{a.bank_name}</p>
                          <p className="text-xs text-muted-foreground">{a.account_name}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      {a.iban && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Hash className="h-3.5 w-3.5" /> <span className="truncate">{a.iban}</span>
                        </div>
                      )}
                      {a.account_number && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="h-3.5 w-3.5" /> {a.account_number}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Bakiye</p>
                        <p className="font-semibold">{formatCurrency(Number(a.balance))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Hesap Tipi</p>
                        <Badge variant="secondary">{a.account_type === 'checking' ? 'Vadesiz' : 'Vadeli'}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Hesap Düzenle' : 'Hesap Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Banka Adı *</Label>
                <Input value={editing.bank_name} onChange={(e) => setEditing({ ...editing, bank_name: e.target.value })} placeholder="Banka adı" />
              </div>
              <div className="space-y-2">
                <Label>Hesap Adı *</Label>
                <Input value={editing.account_name} onChange={(e) => setEditing({ ...editing, account_name: e.target.value })} placeholder="Hesap adı" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hesap Numarası</Label>
                <Input value={editing.account_number} onChange={(e) => setEditing({ ...editing, account_number: e.target.value })} placeholder="Hesap numarası" />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input value={editing.iban} onChange={(e) => setEditing({ ...editing, iban: e.target.value })} placeholder="TR00 0000 0000 0000 0000 0000 00" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Bakiye (₺)</Label>
                <Input type="number" step="0.01" value={editing.balance} onChange={(e) => setEditing({ ...editing, balance: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={editing.currency} onValueChange={(v) => setEditing({ ...editing, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">₺ TRY</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hesap Tipi</Label>
                <Select value={editing.account_type} onValueChange={(v) => setEditing({ ...editing, account_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Vadesiz</SelectItem>
                    <SelectItem value="savings">Vadeli</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !editing.bank_name || !editing.account_name}>
              {saving ? 'Kaydediliyor...' : editing.id ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Hesabı Sil"
        description="Bu banka hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınabilir."
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
