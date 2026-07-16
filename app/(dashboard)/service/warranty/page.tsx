import { supabase } from '@/lib/supabase';
import { ServiceClient } from '@/components/service/service-client';

export const dynamic = 'force-dynamic';

export default async function WarrantyPage() {
  const [{ data: tickets }, { data: customers }] = await Promise.all([
    supabase.from('service_tickets').select('*,customer:customers(*)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  return (
    <ServiceClient
      initialTickets={tickets || []}
      customers={customers || []}
      title="Garanti Takibi"
      description="Garanti kapsamındaki ürün ve servis kayıtlarını yönetin"
      warrantyOnly
    />
  );
}
