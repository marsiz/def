"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { History } from 'lucide-react';

export default function ActivityLogsPage() {
  return (
    <ModulePlaceholder
      title="Activity Logs"
      description="Audit trail of all user actions and system events"
      icon={History}
      features={['Action History', 'User Activity', 'Change Tracking', 'Export Logs', 'Filter by Date/Module']}
    />
  );
}
