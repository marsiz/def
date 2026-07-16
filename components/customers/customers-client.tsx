'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import type { Customer } from '@/lib/types';

interface CustomerForm {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  tax_id: string;
  credit_limit: string;
  notes: string;
}

const emptyForm: CustomerForm = {
  name: '', email: '', phone: '', address: '', company: '', tax_id: '', credit_limit: '0', notes: '',
};

export function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
  );

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const openEdit = (c: Customer) => {
    setEditing({
      id: c.id, name: c.name, email: c.email || '', phone: c.phone || '',
      address: c.address || '', company: c.company || '', tax_id: c.tax_id || '',
      credit_limit: String(c.credit_limit), notes: c.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name) return;
    setSaving(true);
    const payload = {
      name: editing.name,
      email: editing.email || null,
      phone: editing.phone || null,
      address: editing.address || null,
      company: editing.company || null,
      tax_id: editing.tax_id || null,
      credit_limit: parseFloat(editing.credit_limit) || 0,
      notes: editing.notes || null,
    };
    if (editing.id) {
      const { data } = await supabase.from('customers').update(payload).eq('id', editing.id).select().single();
      if (data) setCustomers((prev) => prev.map((c) => (c.id === data.id ? data : c)));
    } else {
      const { data } = await supabase.from('customers').insert(payload).select().single();
      if (data) setCustomers((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('customers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer accounts, balances, and credit limits"
        actionLabel="Add Customer"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, company, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="glass">
          <CardContent>
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No customers found"
              description={search ? "Try adjusting your search" : "Add your first customer to get started"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Customer</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
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
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          {c.company && <p className="text-xs text-muted-foreground">{c.company}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      {c.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" /> {c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {c.phone}
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{c.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className={`font-semibold ${c.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                          {formatCurrency(c.balance)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Credit Limit</p>
                        <p className="font-medium">{formatCurrency(c.credit_limit)}</p>
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
            <DialogTitle>{editing.id ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Customer name" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} placeholder="Company name" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+1-555-0100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} rows={2} placeholder="Street address" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tax ID</Label>
                <Input value={editing.tax_id} onChange={(e) => setEditing({ ...editing, tax_id: e.target.value })} placeholder="TAX-001" />
              </div>
              <div className="space-y-2">
                <Label>Credit Limit ($)</Label>
                <Input type="number" step="0.01" value={editing.credit_limit} onChange={(e) => setEditing({ ...editing, credit_limit: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} placeholder="Internal notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !editing.name}>
              {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action can be undone."
        onConfirm={handleConfirm}
        confirmLabel="Delete"
      />
    </div>
  );
}
