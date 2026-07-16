import { supabase } from '@/lib/supabase';

export async function logActivity(action: string, module?: string, details?: string): Promise<void> {
  try {
    await supabase.rpc('log_activity', {
      p_action: action,
      p_module: module || null,
      p_details: details || null,
    });
  } catch {
    // Silently fail — logging should never break the main operation
  }
}
