"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { UserCog } from 'lucide-react';

export default function UsersPage() {
  return (
    <ModulePlaceholder
      title="User Management"
      description="Manage system users and their access"
      icon={UserCog}
      features={['Create User', 'Edit User', 'Deactivate User', 'Role Assignment', 'Last Login Tracking', 'User Activity']}
    />
  );
}
