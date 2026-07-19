'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Palette, Bell, Shield, Building2, Database, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/theme-provider';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-logger';

export function SettingsClient() {
  const { theme, setTheme } = useTheme();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [companyTaxId, setCompanyTaxId] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyCurrency, setCompanyCurrency] = useState('TRY');
  const [defaultTaxRate, setDefaultTaxRate] = useState('20');

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFreq, setAutoBackupFreq] = useState('daily');
  const [backupRetention, setBackupRetention] = useState('20');

  const [savingCompany, setSavingCompany] = useState(false);
  const [savingBackup, setSavingBackup] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('system_settings').select('*');
      if (!data) return;
      const map: Record<string, string> = {};
      for (const s of data) map[s.key] = s.value;
      setCompanyName(map.company_name || '');
      setCompanyTaxId(map.company_tax_id || '');
      setCompanyAddress(map.company_address || '');
      setCompanyPhone(map.company_phone || '');
      setCompanyEmail(map.company_email || '');
      setCompanyLogoUrl(map.company_logo_url || '');
      setCompanyCurrency(map.company_currency || 'TRY');
      setDefaultTaxRate(map.default_tax_rate || '20');
      setAutoBackupEnabled(map.auto_backup_enabled === 'true');
      setAutoBackupFreq(map.auto_backup_frequency || 'daily');
      setBackupRetention(map.backup_retention_count || '20');
    })();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('system_settings').upsert({
      key, value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    await saveSetting('company_name', companyName);
    await saveSetting('company_tax_id', companyTaxId);
    await saveSetting('company_address', companyAddress);
    await saveSetting('company_phone', companyPhone);
    await saveSetting('company_email', companyEmail);
    await saveSetting('company_logo_url', companyLogoUrl);
    await saveSetting('company_currency', companyCurrency);
    await saveSetting('default_tax_rate', defaultTaxRate);
    toast({ title: 'Kaydedildi', description: 'Şirket bilgileri güncellendi.' });
    logActivity('Ayarlar Güncellendi', 'settings', 'Şirket bilgileri');
    setSavingCompany(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Hata', description: 'Lütfen tüm alanları doldurun.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Hata', description: 'Yeni şifre en az 6 karakter olmalıdır.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Hata', description: 'Yeni şifre ve tekrarı eşleşmiyor.', variant: 'destructive' });
      return;
    }
    setSavingSecurity(true);
    try {
      const { data, error } = await supabase.rpc('change_own_password', {
        p_current_password: currentPassword,
        p_new_password: newPassword,
      });
      if (error) {
        toast({ title: 'Hata', description: error.message || 'Şifre değiştirilemedi.', variant: 'destructive' });
      } else if (data === false) {
        toast({ title: 'Hata', description: 'Mevcut şifre yanlış.', variant: 'destructive' });
      } else {
        toast({ title: 'Başarılı', description: 'Şifreniz güncellendi.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        logActivity('Şifre Değişti', 'settings', 'Güvenlik ayarları');
      }
    } catch (err) {
      toast({ title: 'Hata', description: 'Beklenmeyen bir hata oluştu.', variant: 'destructive' });
    }
    setSavingSecurity(false);
  };

  const handleSaveBackup = async () => {
    setSavingBackup(true);
    await saveSetting('auto_backup_enabled', autoBackupEnabled ? 'true' : 'false');
    await saveSetting('auto_backup_frequency', autoBackupFreq);
    await saveSetting('backup_retention_count', backupRetention);
    toast({ title: 'Kaydedildi', description: 'Yedekleme ayarları güncellendi.' });
    logActivity('Ayarlar Güncellendi', 'settings', 'Yedekleme ayarları');
    setSavingBackup(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar" description="Hesabınızı, tercihlerinizi ve sistem yapılandırmasını yönetin" />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />Profil</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="h-4 w-4" />Tema</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Bildirimler</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" />Güvenlik</TabsTrigger>
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" />Şirket</TabsTrigger>
          <TabsTrigger value="system" className="gap-2"><Database className="h-4 w-4" />Sistem</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
                <CardDescription>Kişisel bilgilerinizi güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Ad Soyad</Label><Input defaultValue={profile?.full_name || ''} disabled /></div>
                  <div className="space-y-2"><Label>E-posta</Label><Input defaultValue={profile?.email || ''} disabled /></div>
                  <div className="space-y-2"><Label>Kullanıcı Adı</Label><Input defaultValue={profile?.username || ''} disabled /></div>
                  <div className="space-y-2"><Label>Telefon</Label><Input defaultValue={profile?.phone || ''} disabled /></div>
                  <div className="space-y-2"><Label>Rol</Label><Input defaultValue={profile?.role === 'admin' ? 'Yönetici' : 'Kullanıcı'} disabled /></div>
                </div>
                <p className="text-xs text-muted-foreground">Profil bilgilerinizi değiştirmek için yöneticinizle iletişime geçin.</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Görünüm</CardTitle>
                <CardDescription>Gösterge panelinizin görünümünü özelleştirin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                          theme === t ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className={`flex h-16 w-16 items-center justify-center rounded-xl ${t === 'dark' ? 'bg-slate-900' : 'bg-slate-100'}`}>
                          <div className={`flex gap-1 ${t === 'dark' ? 'scale-90' : ''}`}>
                            <div className={`h-8 w-2 rounded-full ${t === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`} />
                            <div className="h-8 w-2 rounded-full bg-primary" />
                            <div className={`h-8 w-2 rounded-full ${t === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`} />
                          </div>
                        </div>
                        <span className="text-sm font-medium">{t === 'dark' ? 'Koyu Mod' : 'Açık Mod'}</span>
                        {theme === t && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Bildirim Tercihleri</CardTitle>
                <CardDescription>Hangi uyarıları almak istediğinizi seçin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Düşük Stok Uyarıları', desc: 'Ürünler minimum stok seviyesine ulaştığında bildir' },
                  { label: 'Yeni Siparişler', desc: 'Yeni satış siparişleri için uyarı al' },
                  { label: 'Ödeme Bildirimleri', desc: 'Ödeme durumu değişikliklerinde bildir' },
                  { label: 'Rapor Özetleri', desc: 'Haftalık özet raporları e-posta ile' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked={i < 3} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Güvenlik Ayarları</CardTitle>
                <CardDescription>Şifre ve kimlik doğrulama ayarlarını yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2"><Label>Mevcut Şifre</Label><Input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Yeni Şifre</Label><Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Şifre Tekrar</Label><Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                </div>
                <Button onClick={handleChangePassword} disabled={savingSecurity} className="gap-2">
                  {savingSecurity ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Güvenliği Güncelle
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="company">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Şirket Bilgileri</CardTitle>
                <CardDescription>Şirket bilgilerinizi ve vergi ayarlarını yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Şirket Adı</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Vergi No</Label><Input value={companyTaxId} onChange={(e) => setCompanyTaxId(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Para Birimi</Label>
                    <Select value={companyCurrency} onValueChange={setCompanyCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Varsayılan KDV (%)</Label><Input type="number" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Telefon</Label><Input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} /></div>
                  <div className="space-y-2"><Label>E-posta</Label><Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Logo URL</Label><Input value={companyLogoUrl} onChange={(e) => setCompanyLogoUrl(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Adres</Label><Input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} /></div>
                <Button onClick={handleSaveCompany} disabled={savingCompany} className="gap-2">
                  {savingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Şirketi Kaydet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="system">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Sistem ve Yedekleme Ayarları</CardTitle>
                <CardDescription>Otomatik yedekleme yapılandırması</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Otomatik Yedekleme</p>
                    <p className="text-xs text-muted-foreground">Sistemi otomatik olarak yedekleyin</p>
                  </div>
                  <Switch checked={autoBackupEnabled} onCheckedChange={setAutoBackupEnabled} />
                </div>

                {autoBackupEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Yedekleme Sıklığı</Label>
                      <Select value={autoBackupFreq} onValueChange={setAutoBackupFreq}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Her Gün</SelectItem>
                          <SelectItem value="weekly">Her Hafta</SelectItem>
                          <SelectItem value="monthly">Her Ay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Saklanacak Yedek Sayısı</Label>
                      <Input type="number" value={backupRetention} onChange={(e) => setBackupRetention(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Eski yedekler bu sayıyı aştığında otomatik silinir.</p>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Aktivite Loglama</p>
                    <p className="text-xs text-muted-foreground">Denetim için tüm kullanıcı işlemlerini kaydet</p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>

                <Button onClick={handleSaveBackup} disabled={savingBackup} className="gap-2">
                  {savingBackup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Ayarları Kaydet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
