'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Truck, Mail, Phone, MapPin, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/lib/types';

interface SupplierForm {
  id?: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
}

const emptyForm: SupplierForm = {
  name: '', contact_person: '', email: '', phone: '', address: '',
};

export function SuppliersClient() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  useEffect(() => {
    supabase
      .from('suppliers')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSuppliers(data as Supplier[]);
      });
  }, []);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || '').includes(search)
  );

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const openEdit = (s: Supplier) => {
    setEditing({
      id: s.id,
      name: s.name,
      contact_person: s.contact_person || '',
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name) return;
    setSaving(true);
    const payload = {
      name: editing.name,
      contact_person: editing.contact_person || null,
      email: editing.email || null,
      phone: editing.phone || null,
      address: editing.address || null,
    };
    if (editing.id) {
      const { data } = await supabase.from('suppliers').update(payload).eq('id', editing.id).select().single();
      if (data) setSuppliers((prev) => prev.map((s) => (s.id === data.id ? data : s)));
    } else {
      const { data } = await supabase.from('suppliers').insert(payload).select().single();
      if (data) setSuppliers((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('suppliers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tedarikçiler"
        description="Tedarikçi ilişkilerinizi ve iletişim bilgilerini yönetin"
        actionLabel="Tedarikçi Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="İsim, iletişim kişisi, e-posta veya telefona göre ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="glass">
          <CardContent>
            <EmptyState
              icon={<Truck className="h-8 w-8" />}
              title="Tedarikçi bulunamadı"
              description={search ? "Aramanızı değiştirmeyi deneyin" : "Başlamak için ilk tedarikçinizi ekleyin"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Tedarikçi Ekle</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
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
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          {s.contact_person && (
                            <p className="text-xs text-muted-foreground">{s.contact_person}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      {s.contact_person && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-3.5 w-3.5" /> {s.contact_person}
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" /> {s.email}
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {s.phone}
                        </div>
                      )}
                      {s.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{s.address}</span>
                        </div>
                      )}
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
            <DialogTitle>{editing.id ? 'Tedarikçi Düzenle' : 'Tedarikçi Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Ad *</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Tedarikçi adı" />
            </div>
            <div className="space-y-2">
              <Label>İletişim Kişisi</Label>
              <Input value={editing.contact_person} onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })} placeholder="İletişim kişisi" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="email@ornek.com" />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+90 555 000 0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} placeholder="Adres" />
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
        title="Tedarikçiyi Sil"
        description="Bu tedarikçiyi silmek istediğinizden emin misiniz? Bu işlem geri alınabilir."
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
