'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Award } from 'lucide-react';
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
import type { Brand } from '@/lib/types';

interface BrandForm {
  id?: string;
  name: string;
  description: string;
}

const emptyForm: BrandForm = { name: '', description: '' };

export function BrandsClient() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('brands')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setBrands(data as Brand[]);
      });
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const openEdit = (b: Brand) => {
    setEditing({ id: b.id, name: b.name, description: b.description || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name) return;
    setSaving(true);
    const payload = {
      name: editing.name,
      description: editing.description || null,
    };
    if (editing.id) {
      const { data } = await supabase.from('brands').update(payload).eq('id', editing.id).select().single();
      if (data) setBrands((prev) => prev.map((b) => (b.id === data.id ? data : b)));
    } else {
      const { data } = await supabase.from('brands').insert(payload).select().single();
      if (data) setBrands((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('brands').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Markalar"
        description="Ürün markalarını ve üreticileri yönetin"
        actionLabel="Marka Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="glass">
          <CardContent>
            <EmptyState
              icon={<Award className="h-8 w-8" />}
              title="Marka bulunamadı"
              description={search ? "Aramanızı değiştirmeyi deneyin" : "Başlamak için ilk markanızı ekleyin"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Marka Ekle</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((b, i) => (
              <motion.div
                key={b.id}
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
                          <Award className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{b.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(b.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {b.description && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{b.description}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Marka Düzenle' : 'Marka Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Ad</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Marka adı" />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} placeholder="Marka açıklaması" />
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
        title="Markayı Sil"
        description="Bu markayı silmek istediğinizden emin misiniz? Bu işlem geri alınabilir."
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
