"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { ScanBarcode } from 'lucide-react';

export default function BarcodePage() {
  return (
    <ModulePlaceholder
      title="Barcode Scanner"
      description="Scan and manage product barcodes for quick lookup"
      icon={ScanBarcode}
      features={['Live Camera Scan', 'Manual Barcode Entry', 'Product Lookup', 'Stock Adjustment', 'Generate Barcodes', 'Print Barcodes']}
    />
  );
}
