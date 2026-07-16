import { supabase } from '@/lib/supabase';
import { ExpensesClient } from '@/components/expenses/expenses-client';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
  return <ExpensesClient initialExpenses={data || []} />;
}
