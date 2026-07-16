'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Loader2 } from 'lucide-react';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push('/login');
      } else if (profile && (!profile.is_approved || !profile.is_active)) {
        // Logged in but not approved — redirect to login which shows pending screen
        router.push('/login');
      } else if (!profile) {
        // Session exists but profile fetch failed — could be a race condition
        // Give a short delay then redirect to login
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

  return <>{children}</>;
}
