"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { ShieldCheck } from 'lucide-react';

export default function WarrantyPage() {
  return (
    <ModulePlaceholder
      title="Warranty Tracking"
      description="Manage product warranties and claims"
      icon={ShieldCheck}
      features={['Warranty Registration', 'Warranty Claims', 'Expiration Alerts', 'IMEI Lookup', 'Claim Status Tracking']}
    />
  );
}
