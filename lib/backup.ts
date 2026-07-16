import { supabase } from '@/lib/supabase';

const FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''}/functions/v1/system-backup`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token || '';
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: apiKey,
    'Content-Type': 'application/json',
  };
}

export interface BackupRecord {
  id: string;
  filename: string;
  file_size: number;
  storage_path: string;
  backup_type: string;
  status: string;
  table_count: number;
  record_count: number;
  created_by: string | null;
  created_at: string;
}

export async function createBackup(): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${FUNCTION_URL}?action=backup`, {
      method: 'POST',
      headers,
    });
    const data = await resp.json();
    if (!resp.ok) return { success: false, error: data.error || 'Yedekleme başarısız' };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function restoreBackup(filename: string): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${FUNCTION_URL}?action=restore&filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers,
    });
    const data = await resp.json();
    if (!resp.ok) return { success: false, error: data.error || 'Geri yükleme başarısız' };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function downloadBackup(filename: string): Promise<Blob | null> {
  try {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${FUNCTION_URL}?action=download&filename=${encodeURIComponent(filename)}`, { headers });
    if (!resp.ok) return null;
    return resp.blob();
  } catch {
    return null;
  }
}

export async function deleteBackup(filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const resp = await fetch(`${FUNCTION_URL}?action=delete&filename=${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers,
    });
    const data = await resp.json();
    if (!resp.ok) return { success: false, error: data.error || 'Silme başarısız' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchBackupRecords(): Promise<BackupRecord[]> {
  const { data, error } = await supabase
    .from('backup_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as BackupRecord[];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
