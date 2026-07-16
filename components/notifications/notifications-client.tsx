'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Info, CheckCircle2, AlertTriangle, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/format';
import type { Notification } from '@/lib/types';

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  info: { label: 'Bilgi', icon: <Info className="h-4 w-4" />, className: 'bg-blue-500/10 text-blue-600' },
  success: { label: 'Başarı', icon: <CheckCircle2 className="h-4 w-4" />, className: 'bg-emerald-500/10 text-emerald-600' },
  warning: { label: 'Uyarı', icon: <AlertTriangle className="h-4 w-4" />, className: 'bg-amber-500/10 text-amber-600' },
};

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'info' | 'success' | 'warning'>('all');
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  useEffect(() => {
    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[]);
      });
  }, []);

  const filtered = notifications.filter((n) => typeFilter === 'all' || n.type === typeFilter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirimler"
        description={unreadCount > 0 ? `${unreadCount} okunmamış bildiriminiz var` : 'Tüm bildirimleriniz okundu'}
      />

      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="info">Bilgi</SelectItem>
            <SelectItem value="success">Başarı</SelectItem>
            <SelectItem value="warning">Uyarı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass">
          <CardContent className="p-0">
            <EmptyState
              icon={<Bell className="h-8 w-8" />}
              title="Yeni Bildirim Yok"
              description={typeFilter !== 'all' ? 'Bu türde bildirim bulunmuyor' : 'Şu anda görüntülenecek bildiriminiz yok'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((n, i) => {
              const meta = TYPE_META[n.type] || TYPE_META.info;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className={`glass ${!n.read ? 'border-l-4 border-l-primary' : ''}`}>
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.className}`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          <Badge variant="secondary" className={meta.className}>
                            {meta.label}
                          </Badge>
                          {!n.read && (
                            <Badge variant="default" className="gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-background" />
                              Okunmadı
                            </Badge>
                          )}
                          {n.read && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Okundu
                            </Badge>
                          )}
                        </div>
                        {n.message && (
                          <p className="text-sm text-muted-foreground">{n.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {!n.read && (
                          <Button variant="ghost" size="icon" onClick={() => handleMarkAsRead(n.id)} title="Okundu İşaretle">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)} title="Sil">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Bildirimi Sil"
        description="Bu bildirimi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
