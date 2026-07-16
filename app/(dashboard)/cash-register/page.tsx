import { supabase } from '@/lib/supabase';
import { CashRegisterClient } from '@/components/cash-register/cash-register-client';

export const dynamic = 'force-dynamic';

export default async function CashRegisterPage() {
  const { data } = await supabase.from('cash_register').select('*').order('transaction_date', { ascending: false });
  return <CashRegisterClient initialTransactions={data || []} />;
}
