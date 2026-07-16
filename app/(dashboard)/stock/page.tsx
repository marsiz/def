import { supabase } from '@/lib/supabase';
import { StockClient } from '@/components/stock/stock-client';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const { data: products } = await supabase
    .from('products')
    .select('*,category:categories(*),brand:brands(*),supplier:suppliers(*)')
    .order('created_at', { ascending: false });

  return <StockClient initialProducts={products || []} />;
}
