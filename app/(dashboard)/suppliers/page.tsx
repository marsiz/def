import { supabase } from '@/lib/supabase';
import { SuppliersClient } from '@/components/suppliers/suppliers-client';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
  return <SuppliersClient initialSuppliers={data || []} />;
}
