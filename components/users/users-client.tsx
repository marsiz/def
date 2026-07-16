'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, UserCog, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { formatDateTime } from '@/lib/format';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  last_login: string | null;
  status: 'active' | 'inactive';
}

const DEMO_USERS: DemoUser[] = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@marsiz.com', role: 'Admin', last_login: new Date(Date.now() - 3600000).toISOString(), status: 'active' },
  { id: '2', name: 'Ayşe Kaya', email: 'ayse@marsiz.com', role: 'Müdür', last_login: new Date(Date.now() - 86400000).toISOString(), status: 'active' },
  { id: '3', name: 'Mehmet Demir', email: 'mehmet@marsiz.com', role: 'Satış Temsilcisi', last_login: new Date(Date.now() - 7200000).toISOString(), status: 'active' },
  { id: '4', name: 'Fatma Şahin', email: 'fatma@marsiz.com', role: 'Muhasebe', last_login: new Date(Date.now() - 604800000).toISOString(), status: 'inactive' },
  { id: '5', name: 'Ali Çelik', email: 'ali@marsiz.com', role: 'Teknisyen', last_login: new Date(Date.now() - 432000000).toISOString(), status: 'active' },
];

const ROLES = ['Admin', 'Müdür', 'Satış Temsilcisi', 'Teknisyen', 'Muhasebe'];

interface UserForm {
  id?: string;
  name: string;
  email: string;
  role: string;
  password: string;
}

const emptyForm: UserForm = { name: '', email: '', role: '', password: '' };

export function UsersClient() {
  const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserForm>(emptyForm);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  const openCreate = () => { setEditing(emptyForm); setDialogOpen(true); };

  const openEdit = (u: DemoUser) => {
    setEditing({ id: u.id, name: u.name, email: u.email, role: u.role, password: '' });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editing.name || !editing.email || !editing.role) return;
    if (editing.id) {
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, name: editing.name, email: editing.email, role: editing.role } : u)));
    } else {
      const newUser: DemoUser = {
        id: Date.now().toString(),
        name: editing.name,
        email: editing.email,
        role: editing.role,
        last_login: null,
        status: 'active',
      };
      setUsers((prev) => [newUser, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(() => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    });
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Sistem kullanıcılarını ve erişim yetkilerini yönetin"
        actionLabel="Kullanıcı Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <Card className="glass">
        <CardContent className="p-0">
          {users.length === 0 ? (
            <EmptyState
              icon={<UserCog className="h-8 w-8" />}
              title="Kullanıcı bulunamadı"
              description="Başlamak için ilk kullanıcınızı ekleyin"
              action={<Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Kullanıcı Ekle</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Son Giriş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {users.map((u, i) => (
                    <motion.tr key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                            <UserCog className="h-4 w-4" />
                          </div>
                          {u.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.last_login ? formatDateTime(u.last_login) : 'Hiç giriş yapmadı'}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleStatus(u.id)} className="inline-flex">
                          <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>
                            {u.status === 'active' ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
            <DialogTitle>{editing.id ? 'Kullanıcı Düzenle' : 'Kullanıcı Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ad Soyad" />
            </div>
            <div className="space-y-2">
              <Label>E-posta *</Label>
              <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} placeholder="kullanici@marsiz.com" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Şifre{editing.id ? ' (boş bırakılırsa değişmez)' : ' *'}</Label>
                <Input type="password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} placeholder="••••••••" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={!editing.name || !editing.email || !editing.role || (!editing.id && !editing.password)}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Kullanıcıyı Sil"
        description="Bu kullanıcıyı silmek istediğinizden emin misiniz?"
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
