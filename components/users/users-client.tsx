'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog, Shield, CheckCircle2, XCircle, Loader2, RefreshCw, Clock,
  Plus, Pencil, Trash2, KeyRound, Lock, Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import { logActivity } from '@/lib/activity-logger';
import { MODULES, type ModuleDef } from '@/lib/modules';
import type { PermissionMap } from '@/lib/permissions';

type Role = 'admin' | 'user';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  role: Role;
  is_approved: boolean;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at?: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  can_view: 'Görüntüle',
  can_create: 'Oluştur',
  can_edit: 'Düzenle',
  can_delete: 'Sil',
};

export function UsersClient() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'active' | 'inactive'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<UserRow | null>(null);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<UserRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Kullanıcılar yüklenemedi', description: error.message, variant: 'destructive' });
    } else {
      setUsers((data || []) as UserRow[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateField = async (id: string, field: 'is_approved' | 'is_active' | 'role', value: boolean | Role) => {
    setUpdatingId(id);
    const { error } = await supabase.from('user_profiles').update({ [field]: value }).eq('id', id);
    if (error) {
      toast({ title: 'Güncelleme başarısız', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Güncellendi', description: 'Kullanıcı durumu güncellendi.' });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
      if (id === profile?.id) refreshProfile();
      logActivity('Kullanıcı Güncellendi', 'users', `${field} = ${value}`);
    }
    setUpdatingId(null);
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && !u.is_approved) ||
      (filter === 'approved' && u.is_approved) ||
      (filter === 'active' && u.is_active) ||
      (filter === 'inactive' && !u.is_active);
    return matchesSearch && matchesFilter;
  });

  const pendingCount = users.filter((u) => !u.is_approved).length;
  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader title="Kullanıcı Yönetimi" description="Bu modüle erişim için yönetici yetkisi gereklidir" />
        <Card className="glass">
          <CardContent className="py-12">
            <EmptyState
              icon={<Shield className="h-8 w-8" />}
              title="Yetkisiz Erişim"
              description="Bu sayfayı görüntülemek için yönetici izinlerine ihtiyacınız var."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcı Yönetimi"
        description="Kullanıcıları oluşturun, düzenleyin, yetkilendirin ve yönetin"
        actionLabel="Yeni Kullanıcı"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={() => setCreateOpen(true)}
      />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Yenile
        </Button>
      </div>

      {pendingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4"
        >
          <Clock className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-warning">{pendingCount} kullanıcı onay bekliyor</p>
            <p className="text-sm text-muted-foreground">Onay bekleyen kullanıcıları yetkilendirmek için &quot;Onay Bekleyen&quot; sekmesine geçin.</p>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kullanıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="pending">Onay Bekleyen</SelectItem>
            <SelectItem value="approved">Onaylı</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Pasif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Tümü ({users.length})</TabsTrigger>
          <TabsTrigger value="pending">Onay Bekleyen ({pendingCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <UserTable
            users={filtered}
            loading={loading}
            updatingId={updatingId}
            updateField={updateField}
            currentUserId={profile?.id}
            onEdit={(u) => { setEditingUser(u); setEditOpen(true); }}
            onPermissions={(u) => { setPermissionsUser(u); setPermissionsOpen(true); }}
            onPasswordReset={(u) => { setPasswordResetUser(u); setPasswordResetOpen(true); }}
            onDelete={(u) => { setDeleteUser(u); setDeleteOpen(true); }}
          />
        </TabsContent>
        <TabsContent value="pending">
          <UserTable
            users={filtered.filter((u) => !u.is_approved)}
            loading={loading}
            updatingId={updatingId}
            updateField={updateField}
            currentUserId={profile?.id}
            onEdit={(u) => { setEditingUser(u); setEditOpen(true); }}
            onPermissions={(u) => { setPermissionsUser(u); setPermissionsOpen(true); }}
            onPasswordReset={(u) => { setPasswordResetUser(u); setPasswordResetOpen(true); }}
            onDelete={(u) => { setDeleteUser(u); setDeleteOpen(true); }}
          />
        </TabsContent>
      </Tabs>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchUsers} />
      <EditUserDialog open={editOpen} onOpenChange={setEditOpen} user={editingUser} onUpdated={fetchUsers} />
      <PermissionsDialog open={permissionsOpen} onOpenChange={setPermissionsOpen} user={permissionsUser} />
      <PasswordResetDialog open={passwordResetOpen} onOpenChange={setPasswordResetOpen} user={passwordResetUser} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Kullanıcıyı Sil"
        description={`"${deleteUser?.full_name}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        onConfirm={async () => {
          if (!deleteUser) return;
          const { error } = await supabase.rpc('admin_delete_user', { p_user_id: deleteUser.id });
          if (error) {
            toast({ title: 'Silme başarısız', description: error.message, variant: 'destructive' });
          } else {
            toast({ title: 'Silindi', description: 'Kullanıcı silindi.' });
            logActivity('Kullanıcı Silindi', 'users', deleteUser.email);
            fetchUsers();
          }
        }}
      />
    </div>
  );
}

function UserTable({
  users,
  loading,
  updatingId,
  updateField,
  currentUserId,
  onEdit,
  onPermissions,
  onPasswordReset,
  onDelete,
}: {
  users: UserRow[];
  loading: boolean;
  updatingId: string | null;
  updateField: (id: string, field: 'is_approved' | 'is_active' | 'role', value: boolean | Role) => void;
  currentUserId?: string;
  onEdit: (u: UserRow) => void;
  onPermissions: (u: UserRow) => void;
  onPasswordReset: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}) {
  if (loading) {
    return (
      <Card className="glass">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card className="glass">
        <CardContent className="py-12">
          <EmptyState
            icon={<UserCog className="h-8 w-8" />}
            title="Kullanıcı bulunamadı"
            description="Bu filtreye uygun kullanıcı yok."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Son Giriş</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {users.map((u, i) => (
                  <motion.tr key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.full_name || 'İsimsiz'}
                        {u.id === currentUserId && <Badge variant="outline" className="text-xs">Siz</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.username || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.phone || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => updateField(u.id, 'role', v as Role)}
                        disabled={updatingId === u.id || u.id === currentUserId}
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Yönetici</SelectItem>
                          <SelectItem value="user">Kullanıcı</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {u.is_approved ? (
                          <Badge className="w-fit gap-1 bg-success/15 text-success hover:bg-success/20">
                            <CheckCircle2 className="h-3 w-3" /> Onaylı
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit gap-1 border-warning/50 text-warning">
                            <Clock className="h-3 w-3" /> Beklemede
                          </Badge>
                        )}
                        {u.is_active ? (
                          <Badge variant="secondary" className="w-fit">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit text-muted-foreground">Pasif</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {u.last_login_at ? formatDateTime(u.last_login_at) : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {u.created_at ? formatDateTime(u.created_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {updatingId === u.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            {!u.is_approved && (
                              <Button size="sm" variant="default" className="gap-1" onClick={() => updateField(u.id, 'is_approved', true)}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Onayla
                              </Button>
                            )}
                            {u.is_approved && (
                              <Button size="sm" variant="outline" className="gap-1" onClick={() => updateField(u.id, 'is_approved', false)} disabled={u.id === currentUserId}>
                                <XCircle className="h-3.5 w-3.5" /> Onayı Kaldır
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" title="Düzenle" onClick={() => onEdit(u)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Yetki Düzenle" onClick={() => onPermissions(u)}>
                              <Lock className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Şifre Sıfırla" onClick={() => onPasswordReset(u)}>
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Sil" onClick={() => onDelete(u)} disabled={u.id === currentUserId}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateUserDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [mustChange, setMustChange] = useState(true);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFullName(''); setEmail(''); setUsername(''); setPhone(''); setPassword(''); setRole('user'); setMustChange(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast({ title: 'Eksik bilgi', description: 'Ad Soyad, e-posta ve şifre zorunludur.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_create_user', {
      p_email: email,
      p_password: password,
      p_full_name: fullName,
      p_username: username || null,
      p_phone: phone || null,
      p_role: role,
      p_must_change_password: mustChange,
    });
    if (error) {
      toast({ title: 'Kullanıcı oluşturulamadı', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Kullanıcı oluşturuldu', description: `${email} kullanıcısı başarıyla oluşturuldu.` });
      logActivity('Kullanıcı Oluşturuldu', 'users', `${fullName} (${email})`);
      reset();
      onOpenChange(false);
      onCreated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Kullanıcı</DialogTitle>
          <DialogDescription>Yeni bir kullanıcı hesabı oluşturun</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Ad Soyad *</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Kullanıcı Adı</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <div className="space-y-2"><Label>E-posta *</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Şifre *</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Yönetici</SelectItem>
                  <SelectItem value="user">Kullanıcı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="must-change" checked={mustChange} onCheckedChange={(v) => setMustChange(!!v)} />
            <Label htmlFor="must-change">İlk girişte şifre değişikliği zorunlu</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Oluştur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ open, onOpenChange, user, onUpdated }: { open: boolean; onOpenChange: (v: boolean) => void; user: UserRow | null; onUpdated: () => void }) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('user_profiles').update({
      full_name: fullName,
      username: username || null,
      phone: phone || null,
    }).eq('id', user.id);
    if (error) {
      toast({ title: 'Güncelleme başarısız', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Güncellendi', description: 'Kullanıcı bilgileri güncellendi.' });
      logActivity('Kullanıcı Düzenlendi', 'users', user.email);
      onOpenChange(false);
      onUpdated();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          <DialogDescription>{user?.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Ad Soyad</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Kullanıcı Adı</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefon</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PermissionsDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (v: boolean) => void; user: UserRow | null }) {
  const { toast } = useToast();
  const [perms, setPerms] = useState<PermissionMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      (async () => {
        const { data } = await supabase.from('user_permissions').select('*').eq('user_id', user.id);
        const map: PermissionMap = {};
        for (const p of data || []) {
          map[p.module_key] = p as any;
        }
        setPerms(map);
        setLoading(false);
      })();
    }
  }, [open, user]);

  const togglePerm = (moduleKey: string, field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') => {
    setPerms((prev) => {
      const current = prev[moduleKey] || { module_key: moduleKey, can_view: false, can_create: false, can_edit: false, can_delete: false };
      return { ...prev, [moduleKey]: { ...current, [field]: !current[field] } };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    let errorCount = 0;
    for (const [moduleKey, perm] of Object.entries(perms)) {
      const { error } = await supabase.rpc('set_user_permission', {
        p_user_id: user.id,
        p_module_key: moduleKey,
        p_can_view: perm.can_view,
        p_can_create: perm.can_create,
        p_can_edit: perm.can_edit,
        p_can_delete: perm.can_delete,
      });
      if (error) errorCount++;
    }
    if (errorCount > 0) {
      toast({ title: 'Bazı izinler kaydedilemedi', variant: 'destructive' });
    } else {
      toast({ title: 'İzinler kaydedildi', description: 'Kullanıcı izinleri güncellendi.' });
      logActivity('Yetki Düzenlendi', 'users', user.email);
      onOpenChange(false);
    }
    setSaving(false);
  };

  if (user?.role === 'admin') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yetki Yönetimi</DialogTitle>
            <DialogDescription>{user.full_name}</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-sm text-muted-foreground">
            Yönetici kullanıcıları tüm modüllere otomatik olarak tam erişime sahiptir. Yetki düzenlemesi gerekmez.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yetki Yönetimi — {user?.full_name}</DialogTitle>
          <DialogDescription>Her modül için kullanıcı yetkilerini ayrı ayrı ayarlayın</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 border-b border-border pb-2 text-xs font-semibold text-muted-foreground">
              <span>Modül</span>
              <span className="w-16 text-center">Görüntüle</span>
              <span className="w-16 text-center">Oluştur</span>
              <span className="w-16 text-center">Düzenle</span>
              <span className="w-16 text-center">Sil</span>
            </div>
            {MODULES.map((mod: ModuleDef) => {
              const perm = perms[mod.key] || { module_key: mod.key, can_view: false, can_create: false, can_edit: false, can_delete: false };
              const Icon = mod.icon;
              return (
                <div key={mod.key} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center py-1.5 border-b border-border/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{mod.label}</span>
                  </div>
                  {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((field) => (
                    <div key={field} className="flex justify-center">
                      <Checkbox
                        checked={perm[field]}
                        onCheckedChange={() => togglePerm(mod.key, field)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            İzinleri Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordResetDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (v: boolean) => void; user: UserRow | null }) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: 'Şifre çok kısa', description: 'En az 6 karakter olmalıdır.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc('admin_reset_password', {
      p_user_id: user.id,
      p_new_password: newPassword,
    });
    if (error) {
      toast({ title: 'Şifre sıfırlama başarısız', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Şifre sıfırlandı', description: `${user.email} için şifre sıfırlandı. Kullanıcı ilk girişte değiştirmelidir.` });
      logActivity('Şifre Sıfırlandı', 'users', user.email);
      setNewPassword('');
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Şifre Sıfırla</DialogTitle>
          <DialogDescription>{user?.email} için yeni şifre belirleyin</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label>Yeni Şifre</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning">
            Kullanıcı bir sonraki girişte şifresini değiştirmek zorunda kalacaktır.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Şifreyi Sıfırla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
