"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Banknote } from 'lucide-react';

export default function CashRegisterPage() {
  return (
    <ModulePlaceholder
      title="Cash Register"
      description="Manage daily cash register operations"
      icon={Banknote}
      features={['Open Register', 'Close Register', 'Cash In/Out', 'Daily Reconciliation', 'Register Reports']}
    />
  );
}
