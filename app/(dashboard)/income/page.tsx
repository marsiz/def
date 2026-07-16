import { supabase } from '@/lib/supabase';
import { IncomeClient } from '@/components/income/income-client';

export const dynamic = 'force-dynamic';

export default async function IncomePage() {
  const { data } = await supabase.from('incomes').select('*').order('income_date', { ascending: false });
  return <IncomeClient initialIncomes={data || []} />;
}
