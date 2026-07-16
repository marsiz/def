import { ServiceClient } from '@/components/service/service-client';

export const dynamic = 'force-dynamic';

export default function ServicePage() {
  return <ServiceClient title="Servis Takibi" description="Müşteri cihazları için servis ticketleri açın ve takip edin" />;
}
