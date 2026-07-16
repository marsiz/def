'use client';

import { motion } from 'framer-motion';
import { Construction, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features?: string[];
}

export function ModulePlaceholder({ title, description, icon: Icon, features }: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass overflow-hidden">
          <div className="relative h-48 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30"
            >
              <Icon className="h-10 w-10 text-white" />
            </motion.div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Construction className="h-4 w-4" />
              <span>This module is fully designed and ready for implementation</span>
            </div>
            {features && features.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((f, i) => (
                  <motion.div
                    key={f}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {f}
                  </motion.div>
                ))}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="outline">View Documentation</Button>
              <Button>Configure Module</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
