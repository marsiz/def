"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Banknote } from 'lucide-react';

export default function IncomePage() {
  return (
    <ModulePlaceholder
      title="Income Management"
      description="Track all income sources and revenue streams"
      icon={Banknote}
      features={['Record Income', 'Income Categories', 'Recurring Income', 'Income Reports', 'Revenue Forecasting']}
    />
  );
}
