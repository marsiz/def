"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { ClipboardList } from 'lucide-react';

export default function POSPage() {
  return (
    <ModulePlaceholder
      title="POS Screen"
      description="Point of sale interface for fast checkout"
      icon={ClipboardList}
      features={['Quick Product Search', 'Barcode Scan', 'Cart Management', 'Payment Processing', 'Receipt Printing', 'Cash Drawer']}
    />
  );
}
