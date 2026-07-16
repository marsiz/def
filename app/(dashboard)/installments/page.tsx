"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { CalendarClock } from 'lucide-react';

export default function InstallmentsPage() {
  return (
    <ModulePlaceholder
      title="Installments"
      description="Manage installment plans and payment schedules"
      icon={CalendarClock}
      features={['Create Installment Plan', 'Payment Schedule', 'Installment Tracking', 'Late Payment Alerts', 'Customer Balance']}
    />
  );
}
