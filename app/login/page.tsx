'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Boxes, Mail, Lock, User, Eye, EyeOff, Loader2, ShieldCheck, Clock, KeyRound } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const { session, profile, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && session && profile) {
      if (profile.is_approved && profile.is_active) {
        if (profile.must_change_password) {
          setShowPasswordChange(true);
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [loading, session, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'login') {
      if (!emailOrUsername || !password) {
        setError('Lütfen kullanıcı adı/e-posta ve şifre girin.');
        return;
      }
      setSubmitting(true);
      const { error } = await signIn(emailOrUsername, password);
      if (error) {
        setError(error);
        setSubmitting(false);
      }
    } else {
      if (!email || !password || !fullName) {
        setError('Lütfen tüm alanları doldurun.');
        return;
      }
      setSubmitting(true);
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
        setSubmitting(false);
      } else {
        setSuccess('Hesabınız oluşturuldu! Admin onayını bekleyin. Onaylandıktan sonra giriş yapabilirsiniz.');
        setSubmitting(false);
        setMode('login');
        setEmailOrUsername(email);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    setChangingPassword(true);
    const { data, error: rpcError } = await supabase.rpc('change_own_password', {
      p_current_password: password,
      p_new_password: newPassword,
    });

    if (rpcError) {
      setError('Şifre değiştirilemedi: ' + rpcError.message);
      setChangingPassword(false);
      return;
    }

    if (data === false) {
      setError('Mevcut şifre hatalı.');
      setChangingPassword(false);
      return;
    }

    await supabase.rpc('log_activity', {
      p_action: 'Şifre Değişikliği',
      p_module: 'auth',
      p_details: 'Kullanıcı şifresini değiştirdi',
    });

    setChangingPassword(false);
    setShowPasswordChange(false);
    setNewPassword('');
    setConfirmPassword('');
    setPassword('');
    router.push('/dashboard');
  };

  if (!loading && session && profile && (!profile.is_approved || !profile.is_active)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/20 text-warning">
                <Clock className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold">Onay Bekleniyor</h2>
              <p className="text-sm text-muted-foreground">
                {profile.is_active
                  ? 'Hesabınız henüz admin tarafından onaylanmamış. Onaylandıktan sonra sisteme erişebilirsiniz.'
                  : 'Hesabınız devre dışı bırakılmış. Lütfen yöneticinizle iletişime geçin.'}
              </p>
              <p className="text-xs text-muted-foreground">E-posta: {profile.email}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signOut();
                  window.location.reload();
                }}
              >
                Çıkış Yap
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (showPasswordChange) {
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
                <KeyRound className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Şifre Değiştirme Zorunlu</h1>
                <p className="text-sm text-muted-foreground">Güvenliğiniz için şifrenizi değiştirmeniz gerekmektedir</p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Mevcut Şifre</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yeni Şifre</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yeni Şifre (Tekrar)</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
                <Button type="submit" disabled={changingPassword} className="w-full gap-2">
                  {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  Şifreyi Değiştir ve Devam Et
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <Boxes className="h-7 w-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Marsiz ERP</h1>
              <p className="text-sm text-muted-foreground">Kurumsal Kaynak Planlama Sistemi</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/30 p-1">
              <button
                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className={`rounded-md py-2 text-sm font-medium transition-all ${
                  mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Giriş Yap
              </button>
              <button
                onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
                className={`rounded-md py-2 text-sm font-medium transition-all ${
                  mode === 'register' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label>Ad Soyad</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ad Soyad"
                        className="pl-9"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'login' ? (
                <div className="space-y-2">
                  <Label>Kullanıcı Adı veya E-posta</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="admin veya ornek@marsiz.com"
                      className="pl-9"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@marsiz.com"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Şifre</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}

              <Button type="submit" disabled={submitting} className="w-full gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
              </Button>
            </form>

            {mode === 'register' && (
              <p className="text-center text-xs text-muted-foreground">
                Kayıt olduktan sonra admin onayı gereklidir.
              </p>
            )}

            {mode === 'login' && (
              <div className="rounded-lg bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                <p className="font-medium text-foreground">İlk Giriş Bilgileri</p>
                <p className="mt-1">Kullanıcı: <span className="font-mono">admin</span> — Şifre: <span className="font-mono">admin123</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
