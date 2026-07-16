"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Landmark } from 'lucide-react';

export default function BankAccountsPage() {
  return (
    <ModulePlaceholder
      title="Bank Accounts"
      description="Manage bank accounts and transfers"
      icon={Landmark}
      features={['Account Management', 'Transfers', 'Reconciliation', 'Transaction History', 'Balance Tracking']}
    />
  );
}
