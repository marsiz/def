import { supabase } from '@/lib/supabase';
import { BarcodeClient } from '@/components/barcode/barcode-client';

export const dynamic = 'force-dynamic';

export default async function BarcodePage() {
  const { data: products } = await supabase
    .from('products')
    .select('*,category:categories(*),brand:brands(*)')
    .order('created_at', { ascending: false });

  return <BarcodeClient initialProducts={products || []} />;
}
