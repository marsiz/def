"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Receipt } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <ModulePlaceholder
      title="Invoices"
      description="Manage and track all customer invoices"
      icon={Receipt}
      features={['Invoice Generation', 'Invoice Templates', 'Payment Status', 'Overdue Tracking', 'PDF Export', 'Email Invoices']}
    />
  );
}
