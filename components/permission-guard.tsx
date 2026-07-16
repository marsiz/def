'use client';

import { useAuth } from '@/components/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { NoAccessScreen } from '@/components/no-access';
import { getModuleByHref } from '@/lib/modules';
import { usePathname } from 'next/navigation';
import type { PermissionAction } from '@/lib/permissions';

export function PermissionGuard({
  moduleKey,
  action = 'view',
  children,
}: {
  moduleKey?: string;
  action?: PermissionAction;
  children: React.ReactNode;
}) {
  const { profile, permissions } = useAuth();
  const pathname = usePathname();

  const key = moduleKey || getModuleByHref(pathname)?.key;

  if (!key) {
    return <>{children}</>;
  }

  if (!hasPermission(permissions, profile?.role, key, action)) {
    const mod = getModuleByHref(pathname);
    return <NoAccessScreen moduleName={mod?.label} />;
  }

  return <>{children}</>;
}
