import { supabase } from '@/lib/supabase';
import { NotificationsClient } from '@/components/notifications/notifications-client';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  return <NotificationsClient initialNotifications={data || []} />;
}
