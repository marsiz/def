import { supabase } from '@/lib/supabase';
import { BrandsClient } from '@/components/brands/brands-client';

export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  const { data } = await supabase.from('brands').select('*').order('created_at', { ascending: false });
  return <BrandsClient initialBrands={data || []} />;
}
