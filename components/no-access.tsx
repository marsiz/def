'use client';

import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function NoAccessScreen({ moduleName }: { moduleName?: string }) {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="glass">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <Lock className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Erişim Yetkiniz Bulunmamaktadır</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {moduleName
                  ? `"${moduleName}" modülüne erişim yetkiniz yok. Lütfen yöneticinizle iletişime geçin.`
                  : 'Bu sayfaya erişim yetkiniz bulunmamaktadır. Lütfen yöneticinizle iletişime geçin.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Gösterge Paneline Dön
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
