import { supabase } from '@/lib/supabase';
import { SalesClient } from '@/components/sales/sales-client';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const [{ data: sales }, { data: customers }, { data: products }] = await Promise.all([
    supabase.from('sales').select('*,customer:customers(*)').order('sale_date', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
    supabase.from('products').select('*').order('name'),
  ]);

  return <SalesClient initialSales={sales || []} customers={customers || []} products={products || []} />;
}
