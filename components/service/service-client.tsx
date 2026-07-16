'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Wrench, ShieldCheck } from 'lucide-react';
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
import { formatCurrency, formatDate, generateTicketNumber } from '@/lib/format';
import type { ServiceTicket, Customer } from '@/lib/types';

const STATUS_MAP: Record<string, string> = {
  open: 'Açık',
  in_progress: 'Devam Ediyor',
  waiting_parts: 'Parça Bekliyor',
  completed: 'Tamamlandı',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'secondary',
  in_progress: 'default',
  waiting_parts: 'secondary',
  completed: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

interface TicketForm {
  id?: string;
  customer_id: string;
  product_name: string;
  imei: string;
  password: string;
  accessories_received: string;
  issue_description: string;
  status: string;
  technician_id: string;
  technician_notes: string;
  warranty: boolean;
  estimated_cost: string;
  final_cost: string;
}

const emptyForm: TicketForm = {
  customer_id: '', product_name: '', imei: '', password: '', accessories_received: '',
  issue_description: '', status: 'open', technician_id: '', technician_notes: '',
  warranty: false, estimated_cost: '0', final_cost: '0',
};

interface ServiceClientProps {
  initialTickets: (ServiceTicket & { customer?: Customer | null })[];
  customers: Customer[];
  title: string;
  description: string;
  warrantyOnly?: boolean;
}

export function ServiceClient({ title, description, warrantyOnly }: { title: string; description: string; warrantyOnly?: boolean }) {
  const [tickets, setTickets] = useState<(ServiceTicket & { customer?: Customer | null })[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let query = supabase.from('service_tickets').select('*, customer:customers(*)').order('created_at', { ascending: false });
      if (warrantyOnly) query = query.eq('warranty', true);
      const [{ data: tData }, { data: custData }] = await Promise.all([
        query,
        supabase.from('customers').select('*').order('name'),
      ]);
      setTickets((tData || []) as any);
      setCustomers((custData || []) as Customer[]);
      setLoading(false);
    })();
  }, [warrantyOnly]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TicketForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  let filtered = tickets.filter((t) => {
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      t.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.imei || '').includes(search) ||
      (t.customer?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (warrantyOnly) {
    filtered = filtered.filter((t) => t.warranty);
  }

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };
  const openEdit = (t: ServiceTicket) => {
    setEditing({
      id: t.id, customer_id: t.customer_id || '', product_name: t.product_name, imei: t.imei || '',
      password: t.password || '', accessories_received: t.accessories_received || '',
      issue_description: t.issue_description, status: t.status, technician_id: t.technician_id || '',
      technician_notes: t.technician_notes || '', warranty: t.warranty,
      estimated_cost: String(t.estimated_cost), final_cost: String(t.final_cost),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.product_name || !editing.issue_description) return;
    setSaving(true);
    const payload = {
      customer_id: editing.customer_id || null,
      product_name: editing.product_name,
      imei: editing.imei || null,
      password: editing.password || null,
      accessories_received: editing.accessories_received || null,
      issue_description: editing.issue_description,
      status: editing.status,
      technician_id: editing.technician_id || null,
      technician_notes: editing.technician_notes || null,
      warranty: editing.warranty,
      estimated_cost: parseFloat(editing.estimated_cost) || 0,
      final_cost: parseFloat(editing.final_cost) || 0,
    };
    if (editing.id) {
      const { data } = await supabase.from('service_tickets').update(payload).eq('id', editing.id).select('*,customer:customers(*)').single();
      if (data) setTickets((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    } else {
      const ticketNumber = generateTicketNumber();
      const { data } = await supabase.from('service_tickets').insert({ ...payload, ticket_number: ticketNumber }).select('*,customer:customers(*)').single();
      if (data) setTickets((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('service_tickets').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actionLabel="Yeni Ticket"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Ticket no, ürün, IMEI veya müşteri ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            {Object.entries(STATUS_MAP).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass"><CardContent>
          <EmptyState icon={<Wrench className="h-8 w-8" />} title="Ticket bulunamadı" description={search ? "Aramanızı değiştirmeyi deneyin" : "İlk servis ticketini oluşturun"} action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Yeni Ticket</Button>} />
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((t, i) => (
              <motion.div key={t.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03 }}>
                <Card className="glass hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{t.ticket_number}</p>
                        <p className="text-xs text-muted-foreground">{t.customer?.name || 'Müşteri yok'}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">{t.product_name}</p>
                      {t.imei && <p className="text-xs text-muted-foreground">IMEI: {t.imei}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2">{t.issue_description}</p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Badge variant={STATUS_COLORS[t.status] as any}>{STATUS_MAP[t.status] || t.status}</Badge>
                      {t.warranty && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Garantili</Badge>}
                    </div>
                    {t.estimated_cost > 0 && (
                      <div className="mt-3 flex justify-between border-t border-border/50 pt-2">
                        <span className="text-xs text-muted-foreground">Tahmini Maliyet</span>
                        <span className="text-sm font-medium">{formatCurrency(Number(t.estimated_cost))}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader><DialogTitle>{editing.id ? 'Ticket Düzenle' : 'Yeni Servis Ticketi'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Müşteri</Label>
                <Select value={editing.customer_id} onValueChange={(v) => setEditing({ ...editing, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Müşteri seç" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Ürün Adı *</Label><Input value={editing.product_name} onChange={(e) => setEditing({ ...editing, product_name: e.target.value })} placeholder="Ürün adı" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>IMEI</Label><Input value={editing.imei} onChange={(e) => setEditing({ ...editing, imei: e.target.value })} placeholder="IMEI / Seri No" /></div>
              <div className="space-y-2"><Label>Şifre</Label><Input value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} placeholder="Cihaz şifresi" /></div>
            </div>
            <div className="space-y-2"><Label>Gelen Aksesuarlar</Label><Input value={editing.accessories_received} onChange={(e) => setEditing({ ...editing, accessories_received: e.target.value })} placeholder="Şarj aleti, kablo, kutu vb." /></div>
            <div className="space-y-2"><Label>Arıza Açıklaması *</Label><Textarea value={editing.issue_description} onChange={(e) => setEditing({ ...editing, issue_description: e.target.value })} rows={3} placeholder="Arıza açıklaması" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Durum</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_MAP).map(([v, label]) => <SelectItem key={v} value={v}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Teknisyen</Label><Input value={editing.technician_id} onChange={(e) => setEditing({ ...editing, technician_id: e.target.value })} placeholder="Teknisyen ID" /></div>
            </div>
            <div className="space-y-2"><Label>Teknisyen Notları</Label><Textarea value={editing.technician_notes} onChange={(e) => setEditing({ ...editing, technician_notes: e.target.value })} rows={2} placeholder="Teknisyen notları" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Tahmini Maliyet (₺)</Label><Input type="number" step="0.01" value={editing.estimated_cost} onChange={(e) => setEditing({ ...editing, estimated_cost: e.target.value })} /></div>
              <div className="space-y-2"><Label>Final Maliyet (₺)</Label><Input type="number" step="0.01" value={editing.final_cost} onChange={(e) => setEditing({ ...editing, final_cost: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div><Label className="text-sm font-medium">Garantili</Label><p className="text-xs text-muted-foreground">Garanti kapsamında mı?</p></div>
              <Switch checked={editing.warranty} onCheckedChange={(v) => setEditing({ ...editing, warranty: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !editing.product_name}>{saving ? 'Kaydediliyor...' : editing.id ? 'Güncelle' : 'Oluştur'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={open} onOpenChange={setOpen} title="Ticketi Sil" description="Bu ticketi silmek istediğinizden emin misiniz?" onConfirm={handleConfirm} confirmLabel="Sil" />
    </div>
  );
}
