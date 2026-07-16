"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Wrench } from 'lucide-react';

export default function ServicePage() {
  return (
    <ModulePlaceholder
      title="Service Tracking"
      description="Open and track service tickets for customer devices"
      icon={Wrench}
      features={['Open Service Ticket', 'Repair Status', 'Technician Assignment', 'Waiting Parts', 'Customer Signature', 'Photo Upload', 'IMEI Tracking', 'Password Tracking', 'Accessories Received']}
    />
  );
}
