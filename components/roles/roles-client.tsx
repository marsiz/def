'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, ShieldCheck, Eye, Pencil, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;
}

const MODULES = ['Ürünler', 'Satışlar', 'Müşteriler', 'Tedarikçiler', 'Giderler', 'Faturalar', 'Raporlar', 'Kullanıcılar', 'Ayarlar'];
const PERMISSION_KEYS: (keyof Role['permissions'][string])[] = ['view', 'create', 'edit', 'delete'];
const PERMISSION_LABELS: Record<string, string> = { view: 'Görüntüle', create: 'Oluştur', edit: 'Düzenle', delete: 'Sil' };

const DEMO_ROLES: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Tüm modüllere tam erişim',
    permissions: Object.fromEntries(MODULES.map((m) => [m, { view: true, create: true, edit: true, delete: true }])) as any,
  },
  {
    id: '2',
    name: 'Müdür',
    description: 'Operasyonel yönetim erişimi',
    permissions: Object.fromEntries(MODULES.map((m) => [m, { view: true, create: true, edit: true, delete: m === 'Ayarlar' || m === 'Kullanıcılar' ? false : true }])) as any,
  },
  {
    id: '3',
    name: 'Satış Temsilcisi',
    description: 'Satış ve müşteri yönetimi',
    permissions: Object.fromEntries(MODULES.map((m) => [m, {
      view: true,
      create: ['Ürünler', 'Satışlar', 'Müşteriler', 'Faturalar'].includes(m),
      edit: ['Satışlar', 'Müşteriler', 'Faturalar'].includes(m),
      delete: ['Satışlar', 'Müşteriler'].includes(m),
    }])) as any,
  },
  {
    id: '4',
    name: 'Teknisyen',
    description: 'Servis ve stok yönetimi',
    permissions: Object.fromEntries(MODULES.map((m) => [m, {
      view: ['Ürünler', 'Satışlar', 'Müşteriler'].includes(m),
      create: ['Ürünler'].includes(m),
      edit: ['Ürünler'].includes(m),
      delete: false,
    }])) as any,
  },
  {
    id: '5',
    name: 'Muhasebe',
    description: 'Finansal kayıtlar ve raporlar',
    permissions: Object.fromEntries(MODULES.map((m) => [m, {
      view: true,
      create: ['Giderler', 'Faturalar', 'Raporlar'].includes(m),
      edit: ['Giderler', 'Faturalar'].includes(m),
      delete: ['Giderler'].includes(m),
    }])) as any,
  },
];

function countPermissions(role: Role): number {
  let count = 0;
  for (const mod of MODULES) {
    for (const key of PERMISSION_KEYS) {
      if (role.permissions[mod]?.[key]) count++;
    }
  }
  return count;
}

export function RolesClient() {
  const [roles] = useState<Role[]>(DEMO_ROLES);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roller ve İzinler"
        description="Kullanıcı rollerini ve modül bazlı erişim izinlerini yönetin"
        actionLabel="Rol Ekle"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={() => {}}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role, i) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="glass h-full">
              <CardContent className="flex h-full flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">{role.name}</p>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" disabled>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" disabled>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {MODULES.filter((m) => role.permissions[m]?.view).map((m) => (
                    <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                  ))}
                </div>
                <div className="mt-auto pt-2 text-xs text-muted-foreground">
                  Toplam {countPermissions(role)} izin
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-primary" />
            İzin Matrisi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Modül</TableHead>
                  {PERMISSION_KEYS.map((key) => (
                    <TableHead key={key} className="text-center">{PERMISSION_LABELS[key]}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULES.map((mod) => (
                  <TableRow key={mod}>
                    <TableCell className="font-medium sticky left-0 bg-background">{mod}</TableCell>
                    {PERMISSION_KEYS.map((key) => (
                      <TableCell key={key} className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {roles.map((role) => (
                            <span key={role.id} title={role.name} className="inline-flex">
                              {role.permissions[mod]?.[key] ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-border p-4 text-xs text-muted-foreground">
            <span className="font-medium">Açıklama:</span>
            {roles.map((role) => (
              <span key={role.id} className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{role.name}</span>
                ({countPermissions(role)} izin)
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
