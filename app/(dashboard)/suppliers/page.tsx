"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Truck } from 'lucide-react';

export default function SuppliersPage() {
  return (
    <ModulePlaceholder
      title="Suppliers"
      description="Manage supplier relationships and purchase orders"
      icon={Truck}
      features={['Supplier Directory', 'Contact Management', 'Purchase History', 'Supplier Payments', 'Supplier Ratings']}
    />
  );
}
