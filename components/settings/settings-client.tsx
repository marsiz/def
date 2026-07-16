'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Palette, Bell, Shield, Building2, Database, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/components/theme-provider';
import { PageHeader } from '@/components/shared/page-header';

export function SettingsClient() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    lowStock: true,
    newOrders: true,
    payments: true,
    reports: false,
  });

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
                <CardDescription>Kişisel bilgilerinizi ve avatarınızı güncelleyin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">YK</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Avatar Değiştir</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Ad Soyad</Label><Input defaultValue="Yönetici Kullanıcı" /></div>
                  <div className="space-y-2"><Label>E-posta</Label><Input type="email" defaultValue="admin@marsiz.com" /></div>
                  <div className="space-y-2"><Label>Telefon</Label><Input defaultValue="+90 555 000 0000" /></div>
                  <div className="space-y-2"><Label>Rol</Label><Input defaultValue="Yönetici" disabled /></div>
                </div>
                <Button className="gap-2"><Save className="h-4 w-4" />Değişiklikleri Kaydet</Button>
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
                            <div className={`h-8 w-2 rounded-full ${t === 'dark' ? 'bg-primary' : 'bg-primary'}`} />
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
                <div className="space-y-2">
                  <Label>Dil</Label>
                  <Select defaultValue="tr">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
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
                  { key: 'lowStock' as const, label: 'Düşük Stok Uyarıları', desc: 'Ürünler minimum stok seviyesine ulaştığında bildir' },
                  { key: 'newOrders' as const, label: 'Yeni Siparişler', desc: 'Yeni satış siparişleri için uyarı al' },
                  { key: 'payments' as const, label: 'Ödeme Bildirimleri', desc: 'Ödeme durumu değişikliklerinde bildir' },
                  { key: 'reports' as const, label: 'Rapor Özetleri', desc: 'Haftalık özet raporları e-posta ile' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={notifications[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
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
                  <div className="space-y-2"><Label>Mevcut Şifre</Label><Input type="password" placeholder="••••••••" /></div>
                  <div className="space-y-2"><Label>Yeni Şifre</Label><Input type="password" placeholder="••••••••" /></div>
                  <div className="space-y-2"><Label>Şifre Tekrar</Label><Input type="password" placeholder="••••••••" /></div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">İki Faktörlü Kimlik Doğrulama</p>
                    <p className="text-xs text-muted-foreground">Hesabınıza ekstra güvenlik katmanı ekleyin</p>
                  </div>
                  <Switch />
                </div>
                <Button className="gap-2"><Save className="h-4 w-4" />Güvenliği Güncelle</Button>
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
                  <div className="space-y-2"><Label>Şirket Adı</Label><Input defaultValue="Marsiz Teknoloji A.Ş." /></div>
                  <div className="space-y-2"><Label>Vergi No</Label><Input defaultValue="VKN-MARSIZ-001" /></div>
                  <div className="space-y-2"><Label>Para Birimi</Label>
                    <Select defaultValue="TRY"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TRY">TRY (₺)</SelectItem><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Varsayılan KDV (%)</Label><Input type="number" defaultValue="8" /></div>
                </div>
                <div className="space-y-2"><Label>Adres</Label><Input defaultValue="Atatürk Cad. No:120, İstanbul" /></div>
                <Button className="gap-2"><Save className="h-4 w-4" />Şirketi Kaydet</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="system">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Sistem Ayarları</CardTitle>
                <CardDescription>Veritabanı, yedekleme ve bakım yapılandırması</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Otomatik Yedekleme', desc: 'Her gün 02:00\'da veritabanı yedeği al' },
                  { label: 'Aktivite Loglama', desc: 'Denetim için tüm kullanıcı işlemlerini kaydet' },
                  { label: 'Yumuşak Silme', desc: 'Kalıcı silme yerine kayıtları yumuşak sil' },
                  { label: 'Çoklu Şirket Modu', desc: 'Çoklu şirket veri izolasyonunu etkinleştir' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
