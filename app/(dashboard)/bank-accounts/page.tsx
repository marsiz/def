import { supabase } from '@/lib/supabase';
import { BankAccountsClient } from '@/components/bank-accounts/bank-accounts-client';

export const dynamic = 'force-dynamic';

export default async function BankAccountsPage() {
  const { data } = await supabase.from('bank_accounts').select('*').order('created_at', { ascending: false });
  return <BankAccountsClient initialAccounts={data || []} />;
}
