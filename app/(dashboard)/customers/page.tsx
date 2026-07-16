import { supabase } from '@/lib/supabase';
import { CustomersClient } from '@/components/customers/customers-client';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  return <CustomersClient initialCustomers={data || []} />;
}
