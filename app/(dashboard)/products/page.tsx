import { supabase } from '@/lib/supabase';
import { ProductsClient } from '@/components/products/products-client';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [{ data: products }, { data: categories }, { data: brands }, { data: suppliers }] = await Promise.all([
    supabase.from('products').select('*,category:categories(*),brand:brands(*),supplier:suppliers(*)').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
    supabase.from('brands').select('*').order('name'),
    supabase.from('suppliers').select('*').order('name'),
  ]);

  return (
    <ProductsClient
      initialProducts={products || []}
      categories={categories || []}
      brands={brands || []}
      suppliers={suppliers || []}
    />
  );
}
