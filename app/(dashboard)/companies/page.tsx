import { supabase } from '@/lib/supabase';
import { CompaniesClient } from '@/components/companies/companies-client';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
  return <CompaniesClient initialCompanies={data || []} />;
}
