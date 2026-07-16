import { supabase } from '@/lib/supabase';
import { ReportsClient } from '@/components/reports/reports-client';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [{ data: sales }, { data: expenses }, { data: products }] = await Promise.all([
    supabase.from('sales').select('*,customer:customers(*)').order('sale_date', { ascending: false }).limit(100),
    supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
    supabase.from('products').select('*').order('name'),
  ]);

  return <ReportsClient sales={sales || []} expenses={expenses || []} products={products || []} />;
}
