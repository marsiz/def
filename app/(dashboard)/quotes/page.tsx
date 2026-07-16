import { supabase } from '@/lib/supabase';
import { QuotesClient } from '@/components/quotes/quotes-client';

export const dynamic = 'force-dynamic';

export default async function QuotesPage() {
  const [{ data: quotes }, { data: customers }, { data: products }] = await Promise.all([
    supabase.from('quotes').select('*,customer:customers(*)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
  ]);

  return (
    <QuotesClient
      initialQuotes={quotes || []}
      customers={customers || []}
      products={products || []}
    />
  );
}
