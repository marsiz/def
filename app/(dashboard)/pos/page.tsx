import { supabase } from '@/lib/supabase';
import { PosClient } from '@/components/pos/pos-client';

export const dynamic = 'force-dynamic';

export default async function PosPage() {
  const [{ data: products }, { data: customers }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('customers').select('*').order('name'),
  ]);

  return <PosClient products={products || []} customers={customers || []} />;
}
