"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { DatabaseBackup } from 'lucide-react';

export default function BackupsPage() {
  return (
    <ModulePlaceholder
      title="Backups"
      description="Database backup and restore management"
      icon={DatabaseBackup}
      features={['Manual Backup', 'Scheduled Backups', 'Restore from Backup', 'Download Backup', 'Backup History']}
    />
  );
}
