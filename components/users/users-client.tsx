'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCog, Shield, CheckCircle2, XCircle, Loader2, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { useAuth, type UserProfile } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';

type Role = 'admin' | 'user';

interface UserRow extends UserProfile {
  created_at?: string;
}

export function UsersClient() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'active' | 'inactive'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    }
    setUpdatingId(null);
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
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
        description="Kullanıcıları onaylayın, reddedin ve yetkilerini yönetin"
        actionLabel="Yenile"
        actionIcon={<RefreshCw className="h-4 w-4" />}
        onAction={fetchUsers}
      />

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
        <Input
          placeholder="Kullanıcı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
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
          <UserTable users={filtered} loading={loading} updatingId={updatingId} updateField={updateField} currentUserId={profile?.id} />
        </TabsContent>
        <TabsContent value="pending">
          <UserTable
            users={filtered.filter((u) => !u.is_approved)}
            loading={loading}
            updatingId={updatingId}
            updateField={updateField}
            currentUserId={profile?.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserTable({
  users,
  loading,
  updatingId,
  updateField,
  currentUserId,
}: {
  users: UserRow[];
  loading: boolean;
  updatingId: string | null;
  updateField: (id: string, field: 'is_approved' | 'is_active' | 'role', value: boolean | Role) => void;
  currentUserId?: string;
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kullanıcı</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {users.map((u, i) => (
                <motion.tr key={u.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <UserCog className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {u.full_name || 'İsimsiz'}
                          {u.id === currentUserId && (
                            <Badge variant="outline" className="text-xs">Siz</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
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
                  <TableCell className="text-muted-foreground">
                    {u.created_at ? formatDateTime(u.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {updatingId === u.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {!u.is_approved && (
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={() => updateField(u.id, 'is_approved', true)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Onayla
                            </Button>
                          )}
                          {u.is_approved && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => updateField(u.id, 'is_approved', false)}
                              disabled={u.id === currentUserId}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Onayı Kaldır
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateField(u.id, 'is_active', !u.is_active)}
                            disabled={u.id === currentUserId}
                          >
                            {u.is_active ? 'Pasifleştir' : 'Aktifleştir'}
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
      </CardContent>
    </Card>
  );
}
