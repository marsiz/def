import { supabase } from '@/lib/supabase';
import { InstallmentsClient } from '@/components/installments/installments-client';

export const dynamic = 'force-dynamic';

export default async function InstallmentsPage() {
  const [{ data: installments }, { data: customers }] = await Promise.all([
    supabase.from('installments').select('*,customer:customers(*)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  return <InstallmentsClient initialInstallments={installments || []} customers={customers || []} />;
}
