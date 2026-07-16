"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { FileText } from 'lucide-react';

export default function QuotesPage() {
  return (
    <ModulePlaceholder
      title="Quotes"
      description="Create and manage sales quotes for customers"
      icon={FileText}
      features={['Create Quote', 'Convert to Invoice', 'Quote Templates', 'Expiration Tracking', 'Customer Approval']}
    />
  );
}
