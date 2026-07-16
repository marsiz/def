'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Building2, Phone, Mail, MapPin, Hash, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import type { Company } from '@/lib/types';

const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];

interface CompanyForm {
  id?: string;
  name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  is_active: boolean;
}

const emptyForm: CompanyForm = {
  name: '',
  tax_id: '',
  address: '',
  phone: '',
  email: '',
  currency: 'TRY',
  is_active: true,
};

export function CompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  useEffect(() => {
    supabase
      .from('companies')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCompanies(data as Company[]);
      });
  }, []);

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const openEdit = (c: Company) => {
    setEditing({
      id: c.id,
      name: c.name,
      tax_id: c.tax_id || '',
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      currency: c.currency,
      is_active: c.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name) return;
    setSaving(true);
    const payload = {
      name: editing.name,
      tax_id: editing.tax_id || null,
      address: editing.address || null,
      phone: editing.phone || null,
      email: editing.email || null,
      currency: editing.currency,
      is_active: editing.is_active,
    };

    if (editing.id) {
      const { data } = await supabase.from('companies').update(payload).eq('id', editing.id).select().single();
      if (data) setCompanies((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    } else {
      const { data } = await supabase.from('companies').insert(payload).select().single();
      if (data) setCompanies((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('companies').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Çoklu Şirket"
        description="Birden fazla şirketi tek sistemden yönetin"
        actionLabel="Şirket Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      {companies.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-0">
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title="Şirket bulunamadı"
              description="Başlamak için ilk şirketinizi ekleyin"
              action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Şirket Ekle</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {companies.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="glass h-full">
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">{c.name}</p>
                          <Badge variant={c.is_active ? 'default' : 'secondary'} className="mt-1">
                            {c.is_active ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {c.tax_id && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Hash className="h-4 w-4 shrink-0" />
                          <span>Vergi No: {c.tax_id}</span>
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{c.address}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Coins className="h-4 w-4 shrink-0" />
                        <span>Para Birimi: {c.currency}</span>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Şirket Düzenle' : 'Şirket Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Şirket Adı *</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Şirket adı" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Vergi No</Label>
                <Input value={editing.tax_id} onChange={(e) => setEditing({ ...editing, tax_id: e.target.value })} placeholder="1234567890" />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={editing.currency} onValueChange={(v) => setEditing({ ...editing, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((cur) => <SelectItem key={cur} value={cur}>{cur}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} placeholder="Şirket adresi" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+90 5xx xxx xx xx" />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="info@sirket.com" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label className="text-sm font-medium">Aktif</Label>
                <p className="text-xs text-muted-foreground">Şirketi aktif olarak işaretle</p>
              </div>
              <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !editing.name}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Şirketi Sil"
        description="Bu şirketi silmek istediğinizden emin misiniz? Bu işlem geri alınabilir."
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
