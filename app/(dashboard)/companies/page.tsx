"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Building2 } from 'lucide-react';

export default function CompaniesPage() {
  return (
    <ModulePlaceholder
      title="Multi Company"
      description="Manage multiple companies within a single system"
      icon={Building2}
      features={['Company Switcher', 'Company Settings', 'Data Isolation', 'Shared Resources', 'Consolidated Reports']}
    />
  );
}
