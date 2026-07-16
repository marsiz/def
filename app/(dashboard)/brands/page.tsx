"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Award } from 'lucide-react';

export default function BrandsPage() {
  return (
    <ModulePlaceholder
      title="Brands"
      description="Manage product brands and manufacturers"
      icon={Award}
      features={['Create Brand', 'Edit Brand', 'Delete Brand', 'Product Count', 'Brand Analytics']}
    />
  );
}
