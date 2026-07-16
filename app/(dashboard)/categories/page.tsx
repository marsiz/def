"use client";

import { ModulePlaceholder } from '@/components/shared/module-placeholder';
import { Tags } from 'lucide-react';

export default function CategoriesPage() {
  return (
    <ModulePlaceholder
      title="Categories"
      description="Organize products into categories"
      icon={Tags}
      features={['Create Category', 'Edit Category', 'Delete Category', 'Product Count', 'Category Tree View']}
    />
  );
}
