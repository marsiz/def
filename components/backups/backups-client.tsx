'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseBackup, Download, RotateCcw, Plus, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { formatDateTime } from '@/lib/format';

interface BackupRecord {
  id: string;
  date: string;
  size: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'in_progress' | 'failed';
}

const DEMO_BACKUPS: BackupRecord[] = [
  { id: '1', date: new Date(Date.now() - 3600000).toISOString(), size: '24.5 MB', type: 'auto', status: 'completed' },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), size: '24.2 MB', type: 'auto', status: 'completed' },
  { id: '3', date: new Date(Date.now() - 172800000).toISOString(), size: '23.8 MB', type: 'manual', status: 'completed' },
  { id: '4', date: new Date(Date.now() - 432000000).toISOString(), size: '23.1 MB', type: 'auto', status: 'completed' },
  { id: '5', date: new Date(Date.now() - 604800000).toISOString(), size: '22.5 MB', type: 'manual', status: 'completed' },
];

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
  completed: { label: 'Tamamlandı', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  in_progress: { label: 'Devam ediyor', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  failed: { label: 'Başarısız', variant: 'destructive', icon: <Clock className="h-3 w-3" /> },
};

export function BackupsClient() {
  const [backups, setBackups] = useState<BackupRecord[]>(DEMO_BACKUPS);
  const [creating, setCreating] = useState(false);

  const handleCreateBackup = () => {
    setCreating(true);
    setTimeout(() => {
      const newBackup: BackupRecord = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        size: `${(20 + Math.random() * 10).toFixed(1)} MB`,
        type: 'manual',
        status: 'completed',
      };
      setBackups((prev) => [newBackup, ...prev]);
      setCreating(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yedekler"
        description="Veritabanı yedeklerini oluşturun ve yönetin"
        actionLabel="Yedek Al"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={handleCreateBackup}
      />

      <Card className="glass">
        <CardContent className="p-0">
          {backups.length === 0 ? (
            <EmptyState
              icon={<DatabaseBackup className="h-8 w-8" />}
              title="Yedek bulunamadı"
              description="Henüz yedekleme kaydınız bulunmuyor"
              action={<Button onClick={handleCreateBackup} className="gap-2"><Plus className="h-4 w-4" />Yedek Al</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Yedekleme Geçmişi</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Boyut</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {backups.map((b, i) => {
                    const statusMeta = STATUS_META[b.status];
                    return (
                      <motion.tr key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                              <DatabaseBackup className="h-4 w-4" />
                            </div>
                            <span className="font-mono text-xs">YDK-{b.id.padStart(6, '0')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(b.date)}</TableCell>
                        <TableCell className="text-muted-foreground">{b.size}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{b.type === 'auto' ? 'Otomatik' : 'Manuel'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusMeta.variant} className="gap-1">
                            {statusMeta.icon}
                            {statusMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="İndir">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Geri Yükle">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Yedek oluşturuluyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
