'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Palette, Bell, Shield, Globe, Database, Building2, Save } from 'lucide-react';
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
      <PageHeader title="Settings" description="Manage your account, preferences, and system configuration" />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
          <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="h-4 w-4" />Theme</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Alerts</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" />Security</TabsTrigger>
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" />Company</TabsTrigger>
          <TabsTrigger value="system" className="gap-2"><Database className="h-4 w-4" />System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and avatar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">AD</AvatarFallback>
                  </Avatar>
                  <Button variant="outline">Change Avatar</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue="Admin User" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" defaultValue="admin@marsiz.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input defaultValue="+1-555-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input defaultValue="Administrator" disabled />
                  </div>
                </div>
                <Button className="gap-2"><Save className="h-4 w-4" />Save Changes</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel of your dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
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
                        <span className="text-sm font-medium capitalize">{t} Mode</span>
                        {theme === t && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-xs">✓</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
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
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what alerts you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'lowStock' as const, label: 'Low Stock Alerts', desc: 'Get notified when products reach minimum stock level' },
                  { key: 'newOrders' as const, label: 'New Orders', desc: 'Receive alerts for new sales orders' },
                  { key: 'payments' as const, label: 'Payment Notifications', desc: 'Get notified about payment status changes' },
                  { key: 'reports' as const, label: 'Report Summaries', desc: 'Weekly summary reports via email' },
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
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage password and authentication settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="text-sm font-medium">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
                <Button className="gap-2"><Save className="h-4 w-4" />Update Security</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="company">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Manage your company details and tax settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Company Name</Label><Input defaultValue="Marsiz Technologies" /></div>
                  <div className="space-y-2"><Label>Tax ID</Label><Input defaultValue="TAX-MARSIZ-001" /></div>
                  <div className="space-y-2"><Label>Currency</Label>
                    <Select defaultValue="USD"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Default Tax Rate (%)</Label><Input type="number" defaultValue="8" /></div>
                </div>
                <div className="space-y-2"><Label>Address</Label><Input defaultValue="120 Commerce St, New York, NY" /></div>
                <Button className="gap-2"><Save className="h-4 w-4" />Save Company</Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="system">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass max-w-2xl">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Database, backup, and maintenance configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Automatic Backups', desc: 'Run daily database backups at 2:00 AM' },
                  { label: 'Activity Logging', desc: 'Log all user actions for audit purposes' },
                  { label: 'Soft Delete', desc: 'Soft delete records instead of permanent deletion' },
                  { label: 'Multi-Company Mode', desc: 'Enable multi-company data isolation' },
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
