import { ServiceClient } from '@/components/service/service-client';

export const dynamic = 'force-dynamic';

export default function WarrantyPage() {
  return <ServiceClient title="Garanti Takibi" description="Garanti kapsamındaki ürün ve servis kayıtlarını yönetin" warrantyOnly />;
}
