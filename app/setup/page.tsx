'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Loader2, Crown, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@marsiz.com');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('Sistem Yöneticisi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_admin_exists');
      if (!error && data === true) {
        setAdminExists(true);
      }
      setChecking(false);
    })();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !fullName) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    // Step 1: Create the user account
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Kullanıcı oluşturulamadı.');
      setLoading(false);
      return;
    }

    // Step 2: Sign in as the new user
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError('Kullanıcı oluşturuldu ama giriş yapılamadı: ' + signInError.message);
      setLoading(false);
      return;
    }

    // Step 3: Promote to admin via secure RPC (only works if no admin exists)
    const { error: promoteError } = await supabase.rpc('promote_first_admin');
    if (promoteError) {
      setError('Admin yetkisi verilemedi: ' + promoteError.message);
      setLoading(false);
      return;
    }

    // Step 4: Update full_name
    await supabase.from('user_profiles').update({ full_name: fullName }).eq('id', data.user.id);

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If admin already exists, redirect to login
  if (adminExists) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="glass-strong border-border/60">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold">Kurulum Tamamlandı</h2>
              <p className="text-sm text-muted-foreground">
                Sistem yöneticisi zaten oluşturulmuş. Giriş yapmak için giriş sayfasına yönlendiriliyorsunuz.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Giriş Sayfasına Git
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass-strong border-border/60">
          <CardHeader className="space-y-3 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30"
            >
              <Crown className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Kurulumu</h1>
              <p className="text-sm text-muted-foreground">Sistem yöneticisi hesabını oluşturun</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Bu sayfa yalnızca ilk kurulum içindir. Admin oluşturduktan sonra bu sayfa kilitlenir.</span>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-8 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/20 text-success">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold">Admin Hesabı Oluşturuldu!</h3>
                <p className="text-sm text-muted-foreground">Gösterge paneline yönlendiriliyorsunuz...</p>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </motion.div>
            ) : (
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sistem Yöneticisi" />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@marsiz.com" />
                </div>
                <div className="space-y-2">
                  <Label>Şifre</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Admin Hesabı Oluştur
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
