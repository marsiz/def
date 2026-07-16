'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseBackup, Download, RotateCcw, Plus, CheckCircle2, Clock, Trash2, Loader2, Shield, HardDrive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/format';
import { logActivity } from '@/lib/activity-logger';
import { NoAccessScreen } from '@/components/no-access';
import {
  fetchBackupRecords, createBackup, restoreBackup, downloadBackup, deleteBackup,
  formatFileSize, type BackupRecord,
} from '@/lib/backup';

export function BackupsClient() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<BackupRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BackupRecord | null>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    const records = await fetchBackupRecords();
    setBackups(records);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  if (profile?.role !== 'admin') {
    return <NoAccessScreen moduleName="Yedekler" />;
  }

  const handleCreateBackup = async () => {
    setCreating(true);
    const result = await createBackup();
    if (result.success) {
      toast({
        title: 'Yedek oluşturuldu',
        description: `${result.data.table_count} tablo, ${result.data.record_count} kayıt yedeklendi.`,
      });
      logActivity('Yedek Alındı', 'backups', result.data.filename);
      fetchBackups();
    } else {
      toast({ title: 'Yedekleme başarısız', description: result.error, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDownload = async (backup: BackupRecord) => {
    setDownloading(backup.filename);
    const blob = await downloadBackup(backup.filename);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.filename;
      a.click();
      URL.revokeObjectURL(url);
      logActivity('Yedek İndirildi', 'backups', backup.filename);
    } else {
      toast({ title: 'İndirme başarısız', variant: 'destructive' });
    }
    setDownloading(null);
  };

  const handleRestore = async (backup: BackupRecord) => {
    setRestoring(backup.filename);
    const result = await restoreBackup(backup.filename);
    if (result.success) {
      toast({
        title: 'Geri yükleme tamamlandı',
        description: `${result.data.restored_records} kayıt geri yüklendi.`,
      });
      logActivity('Yedek Geri Yüklendi', 'backups', backup.filename);
    } else {
      toast({ title: 'Geri yükleme başarısız', description: result.error, variant: 'destructive' });
    }
    setRestoring(null);
    setRestoreConfirm(null);
  };

  const handleDelete = async (backup: BackupRecord) => {
    setDeleting(backup.filename);
    const result = await deleteBackup(backup.filename);
    if (result.success) {
      toast({ title: 'Yedek silindi' });
      logActivity('Yedek Silindi', 'backups', backup.filename);
      fetchBackups();
    } else {
      toast({ title: 'Silme başarısız', description: result.error, variant: 'destructive' });
    }
    setDeleting(null);
    setDeleteConfirm(null);
  };

  const totalSize = backups.reduce((sum, b) => sum + b.file_size, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yedekler"
        description="Tam sistem yedekleme ve geri yükleme"
        actionLabel="Yedek Al"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={handleCreateBackup}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DatabaseBackup className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{backups.length}</p>
              <p className="text-xs text-muted-foreground">Toplam Yedek</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              <p className="text-xs text-muted-foreground">Toplam Boyut</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{backups.filter((b) => b.backup_type === 'auto').length}</p>
              <p className="text-xs text-muted-foreground">Otomatik Yedek</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : backups.length === 0 ? (
            <EmptyState
              icon={<DatabaseBackup className="h-8 w-8" />}
              title="Yedek bulunamadı"
              description="Henüz yedekleme kaydınız bulunmuyor. 'Yedek Al' butonu ile ilk yedeğinizi oluşturun."
              action={<Button onClick={handleCreateBackup} className="gap-2"><Plus className="h-4 w-4" />Yedek Al</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dosya Adı</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Boyut</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Tablo</TableHead>
                    <TableHead>Kayıt</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {backups.map((b, i) => (
                      <motion.tr key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }}>
                        <TableCell className="font-mono text-xs">{b.filename}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{formatDateTime(b.created_at)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatFileSize(b.file_size)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{b.backup_type === 'auto' ? 'Otomatik' : 'Manuel'}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{b.table_count}</TableCell>
                        <TableCell className="text-muted-foreground">{b.record_count.toLocaleString('tr-TR')}</TableCell>
                        <TableCell>
                          <Badge className="gap-1 bg-success/15 text-success hover:bg-success/20">
                            <CheckCircle2 className="h-3 w-3" /> Tamamlandı
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="İndir" disabled={downloading === b.filename} onClick={() => handleDownload(b)}>
                              {downloading === b.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" title="Geri Yükle" disabled={restoring === b.filename} onClick={() => setRestoreConfirm(b)}>
                              {restoring === b.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" title="Sil" disabled={deleting === b.filename} onClick={() => setDeleteConfirm(b)}>
                              {deleting === b.filename ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!restoreConfirm}
        onOpenChange={(v) => !v && setRestoreConfirm(null)}
        title="Yedeği Geri Yükle"
        description={`Bu işlem mevcut sistem verilerinin tamamını "${restoreConfirm?.filename}" yedeği ile değiştirecektir. Bu işlem geri alınamaz. Devam etmek istediğinize emin misiniz?`}
        confirmLabel="Geri Yükle"
        destructive={false}
        onConfirm={() => restoreConfirm && handleRestore(restoreConfirm)}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(v) => !v && setDeleteConfirm(null)}
        title="Yedeği Sil"
        description={`"${deleteConfirm?.filename}" yedeğini kalıcı olarak silmek istediğinize emin misiniz?`}
        confirmLabel="Sil"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
      />

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Tam sistem yedekleniyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
