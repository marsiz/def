import {
  LayoutDashboard,
  Package,
  Warehouse,
  ScanBarcode,
  Tags,
  Award,
  Truck,
  Users,
  ShoppingCart,
  Receipt,
  FileText,
  Wrench,
  ShieldCheck,
  CreditCard,
  Banknote,
  Landmark,
  CalendarClock,
  BarChart3,
  Bell,
  Settings,
  UserCog,
  Lock,
  Building2,
  History,
  DatabaseBackup,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';

export interface ModuleDef {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  section: string;
  description: string;
}

export const MODULES: ModuleDef[] = [
  { key: 'dashboard', label: 'Gösterge Paneli', href: '/dashboard', icon: LayoutDashboard, section: 'Genel Bakış', description: 'Genel sistem özeti ve istatistikler' },
  { key: 'products', label: 'Ürünler', href: '/products', icon: Package, section: 'Stok', description: 'Ürün kataloğu yönetimi' },
  { key: 'stock', label: 'Stok Yönetimi', href: '/stock', icon: Warehouse, section: 'Stok', description: 'Stok hareketleri ve envanter' },
  { key: 'barcode', label: 'Barkod', href: '/barcode', icon: ScanBarcode, section: 'Stok', description: 'Barkod okuma ve oluşturma' },
  { key: 'categories', label: 'Kategoriler', href: '/categories', icon: Tags, section: 'Stok', description: 'Ürün kategorileri' },
  { key: 'brands', label: 'Markalar', href: '/brands', icon: Award, section: 'Stok', description: 'Marka yönetimi' },
  { key: 'suppliers', label: 'Tedarikçiler', href: '/suppliers', icon: Truck, section: 'Stok', description: 'Tedarikçi yönetimi' },
  { key: 'customers', label: 'Müşteriler', href: '/customers', icon: Users, section: 'Satış', description: 'Müşteri ve cari yönetimi' },
  { key: 'sales', label: 'Satışlar', href: '/sales', icon: ShoppingCart, section: 'Satış', description: 'Satış işlemleri' },
  { key: 'invoices', label: 'Faturalar', href: '/invoices', icon: Receipt, section: 'Satış', description: 'Fatura yönetimi' },
  { key: 'quotes', label: 'Teklifler', href: '/quotes', icon: FileText, section: 'Satış', description: 'Teklif oluşturma ve yönetimi' },
  { key: 'pos', label: 'POS Ekranı', href: '/pos', icon: ClipboardList, section: 'Satış', description: 'Satış noktası ekranı' },
  { key: 'service', label: 'Servis Takibi', href: '/service', icon: Wrench, section: 'Servis', description: 'Servis biletleri ve takip' },
  { key: 'expenses', label: 'Giderler', href: '/expenses', icon: CreditCard, section: 'Finans', description: 'Gider kayıtları' },
  { key: 'income', label: 'Gelirler', href: '/income', icon: Banknote, section: 'Finans', description: 'Gelir kayıtları' },
  { key: 'cash-register', label: 'Kasa', href: '/cash-register', icon: Banknote, section: 'Finans', description: 'Kasa hareketleri' },
  { key: 'bank-accounts', label: 'Banka Hesapları', href: '/bank-accounts', icon: Landmark, section: 'Finans', description: 'Banka hesap yönetimi' },
  { key: 'installments', label: 'Taksitler', href: '/installments', icon: CalendarClock, section: 'Finans', description: 'Taksitli satış takibi' },
  { key: 'reports', label: 'Raporlar', href: '/reports', icon: BarChart3, section: 'Analiz', description: 'Sistem raporları ve analizler' },
  { key: 'notifications', label: 'Bildirimler', href: '/notifications', icon: Bell, section: 'Analiz', description: 'Sistem bildirimleri' },
  { key: 'settings', label: 'Ayarlar', href: '/settings', icon: Settings, section: 'Sistem', description: 'Sistem ayarları' },
  { key: 'users', label: 'Kullanıcı Yönetimi', href: '/users', icon: UserCog, section: 'Sistem', description: 'Kullanıcı yönetimi ve yetkilendirme' },
  { key: 'roles', label: 'Roller ve İzinler', href: '/roles', icon: Lock, section: 'Sistem', description: 'Rol ve yetki yönetimi' },
  { key: 'companies', label: 'Çoklu Şirket', href: '/companies', icon: Building2, section: 'Sistem', description: 'Çoklu şirket yönetimi' },
  { key: 'activity-logs', label: 'Aktivite Logları', href: '/activity-logs', icon: History, section: 'Sistem', description: 'Sistem aktivite kayıtları' },
  { key: 'backups', label: 'Yedekler', href: '/backups', icon: DatabaseBackup, section: 'Sistem', description: 'Sistem yedekleme yönetimi' },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

export const MODULE_MAP: Record<string, ModuleDef> = Object.fromEntries(
  MODULES.map((m) => [m.key, m])
);

export function getModuleByHref(href: string): ModuleDef | undefined {
  const normalized = href.replace(/\/+$/, '');
  return MODULES.find(
    (m) => m.href === normalized || (m.href !== '/dashboard' && normalized.startsWith(m.href))
  );
}

export function getModuleByKey(key: string): ModuleDef | undefined {
  return MODULE_MAP[key];
}

export interface NavSection {
  title: string;
  items: ModuleDef[];
}

export function getNavSections(): NavSection[] {
  const sections: Record<string, ModuleDef[]> = {};
  for (const mod of MODULES) {
    if (!sections[mod.section]) sections[mod.section] = [];
    sections[mod.section].push(mod);
  }
  return Object.entries(sections).map(([title, items]) => ({ title, items }));
}
