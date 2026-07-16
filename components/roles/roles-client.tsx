'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Lock, Users, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { MODULES, type ModuleDef } from '@/lib/modules';
import { NoAccessScreen } from '@/components/no-access';
import { useRouter } from 'next/navigation';

interface UserWithPerms {
  id: string;
  full_name: string;
  email: string;
  username: string | null;
  role: 'admin' | 'user';
  is_approved: boolean;
  is_active: boolean;
  permissions: Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>;
}

const PERM_FIELDS = ['can_view', 'can_create', 'can_edit', 'can_delete'] as const;
const PERM_LABELS: Record<string, string> = {
  can_view: 'Görüntüle',
  can_create: 'Oluştur',
  can_edit: 'Düzenle',
  can_delete: 'Sil',
};

export function RolesClient() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithPerms[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: perms }] = await Promise.all([
      supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_permissions').select('*'),
    ]);

    const permMap: Record<string, Record<string, any>> = {};
    for (const p of perms || []) {
      if (!permMap[p.user_id]) permMap[p.user_id] = {};
      permMap[p.user_id][p.module_key] = p;
    }

    const result: UserWithPerms[] = (profiles || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      username: p.username,
      role: p.role,
      is_approved: p.is_approved,
      is_active: p.is_active,
      permissions: permMap[p.id] || {},
    }));

    setUsers(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (profile?.role !== 'admin') {
    return <NoAccessScreen moduleName="Roller ve İzinler" />;
  }

  const filtered = users.filter((u) =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const togglePerm = async (userId: string, moduleKey: string, field: typeof PERM_FIELDS[number], currentValue: boolean) => {
    setSaving(`${userId}-${moduleKey}-${field}`);
    const user = users.find((u) => u.id === userId);
    const existing = user?.permissions[moduleKey] || { can_view: false, can_create: false, can_edit: false, can_delete: false };

    const newPerm = { ...existing, [field]: !currentValue };

    const { error } = await supabase.rpc('set_user_permission', {
      p_user_id: userId,
      p_module_key: moduleKey,
      p_can_view: newPerm.can_view,
      p_can_create: newPerm.can_create,
      p_can_edit: newPerm.can_edit,
      p_can_delete: newPerm.can_delete,
    });

    if (error) {
      toast({ title: 'İzin güncellenemedi', description: error.message, variant: 'destructive' });
    } else {
      setUsers((prev) => prev.map((u) => {
        if (u.id !== userId) return u;
        return { ...u, permissions: { ...u.permissions, [moduleKey]: newPerm } };
      }));
    }
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roller ve İzinler"
        description="Kullanıcı bazlı modül yetkilendirme matrisi. Admin tüm modüllere otomatik erişir."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Yönetici (Admin)</p>
              <p className="text-xs text-muted-foreground">Tüm modüllere tam erişim</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Kullanıcı</p>
              <p className="text-xs text-muted-foreground">Admin tarafından yetkilendirilir</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{users.length} Kullanıcı</p>
              <p className="text-xs text-muted-foreground">{users.filter((u) => u.role === 'admin').length} yönetici</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Kullanıcı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            Kullanıcı Bazlı Yetki Matrisi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">Kullanıcı</TableHead>
                  {MODULES.map((mod: ModuleDef) => {
                    const Icon = mod.icon;
                    return (
                      <TableHead key={mod.key} className="text-center min-w-[80px]">
                        <div className="flex flex-col items-center gap-1">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] whitespace-nowrap">{mod.label}</span>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="sticky left-0 bg-background z-10">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm">{u.full_name}</span>
                            {u.role === 'admin' && <Badge className="text-[10px] bg-primary/15 text-primary">Admin</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    {MODULES.map((mod) => {
                      const perm = u.permissions[mod.key];
                      const canView = u.role === 'admin' || perm?.can_view || false;
                      return (
                        <TableCell key={mod.key} className="text-center">
                          {u.role === 'admin' ? (
                            <div className="flex justify-center">
                              <Checkbox checked disabled />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <Checkbox
                                checked={canView}
                                onCheckedChange={() => togglePerm(u.id, mod.key, 'can_view', canView)}
                                disabled={saving === `${u.id}-${mod.key}-can_view`}
                              />
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-border p-4 text-xs text-muted-foreground">
            Görüntüleme yetkisi verildiğinde, kullanıcı modüle erişebilir. Detaylı yetkilendirme (oluştur, düzenle, sil) için
            <button onClick={() => router.push('/users')} className="ml-1 text-primary hover:underline">Kullanıcı Yönetimi</button>
            sayfasını kullanın.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
