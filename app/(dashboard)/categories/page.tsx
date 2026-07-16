import { supabase } from '@/lib/supabase';
import { CategoriesClient } from '@/components/categories/categories-client';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
  return <CategoriesClient initialCategories={data || []} />;
}
