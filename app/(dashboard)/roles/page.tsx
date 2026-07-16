"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Lock } from 'lucide-react';

export default function RolesPage() {
  return (
    <ModulePlaceholder
      title="Roles & Permissions"
      description="Define roles and manage access permissions"
      icon={Lock}
      features={['Create Role', 'Edit Role', 'Permission Matrix', 'Module Access Control', 'Action-level Permissions']}
    />
  );
}
