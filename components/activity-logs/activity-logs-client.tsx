'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { formatDateTime } from '@/lib/format';
import type { ActivityLog } from '@/lib/types';

export function ActivityLogsClient({ initialLogs }: { initialLogs: ActivityLog[] }) {
  const [search, setSearch] = useState('');

  const filtered = initialLogs.filter((l) => {
    const q = search.toLowerCase();
    return (
      (l.user_name || '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      (l.module || '').toLowerCase().includes(q) ||
      (l.details || '').toLowerCase().includes(q) ||
      (l.ip_address || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aktivite Logları"
        description="Sistemdeki tüm kullanıcı işlemlerinin geçmişi"
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

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8" />}
              title="Log bulunamadı"
              description={search ? 'Aramanızı değiştirmeyi deneyin' : 'Henüz aktivite kaydı bulunmuyor'}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Modül</TableHead>
                  <TableHead>Detaylar</TableHead>
                  <TableHead>IP Adresi</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((l, i) => (
                    <motion.tr
                      key={l.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <TableCell className="font-medium">{l.user_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{l.action}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{l.module || '—'}</TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground" title={l.details || ''}>
                        {l.details || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{l.ip_address || '—'}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(l.created_at)}</TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
