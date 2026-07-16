"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { ShieldCheck } from 'lucide-react';

export default function RepairsPage() {
  return (
    <ModulePlaceholder
      title="Repair Tracking"
      description="Track repair progress from intake to delivery"
      icon={ShieldCheck}
      features={['Repair Queue', 'Status: Waiting Parts', 'Status: In Progress', 'Status: Completed', 'Status: Delivered', 'Status: Cancelled', 'Technician Notes', 'Repair History']}
    />
  );
}
