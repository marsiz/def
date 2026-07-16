"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <ModulePlaceholder
      title="Notifications"
      description="View and manage all system notifications"
      icon={Bell}
      features={['Real-time Alerts', 'Low Stock Warnings', 'Payment Reminders', 'Activity Notifications', 'Notification Preferences']}
    />
  );
}
