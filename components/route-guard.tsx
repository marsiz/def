'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { hasPermission } from '@/lib/permissions';
import { getModuleByHref } from '@/lib/modules';
import { Loader2 } from 'lucide-react';
import { NoAccessScreen } from '@/components/no-access';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, permissions, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push('/login');
      } else if (profile && (!profile.is_approved || !profile.is_active)) {
        router.push('/login');
      } else if (!profile) {
        const timer = setTimeout(() => {
          router.push('/login');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, session, profile, router]);

  if (loading || !session || !profile || !profile.is_approved || !profile.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const mod = getModuleByHref(pathname);
  if (mod && !hasPermission(permissions, profile.role, mod.key, 'view')) {
    return <NoAccessScreen moduleName={mod.label} />;
  }

  return <>{children}</>;
}
