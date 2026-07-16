import { supabase } from '@/lib/supabase';
import { ActivityLogsClient } from '@/components/activity-logs/activity-logs-client';

export const dynamic = 'force-dynamic';

export default async function ActivityLogsPage() {
  const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
  return <ActivityLogsClient initialLogs={data || []} />;
}
