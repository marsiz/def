"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Warehouse } from 'lucide-react';

export default function StockPage() {
  return (
    <ModulePlaceholder
      title="Stock Management"
      description="Track stock entries, exits, and warehouse operations"
      icon={Warehouse}
      features={['Stock Entry', 'Stock Exit', 'Warehouse Management', 'Serial Number Tracking', 'IMEI Tracking', 'Minimum Stock Warning', 'Bulk Import (Excel)', 'Bulk Export (Excel)']}
    />
  );
}
