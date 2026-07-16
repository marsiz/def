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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: 'Genel Bakış',
    items: [
      { label: 'Gösterge Paneli', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Stok',
    items: [
      { label: 'Ürünler', href: '/products', icon: Package },
      { label: 'Stok Yönetimi', href: '/stock', icon: Warehouse },
      { label: 'Barkod', href: '/barcode', icon: ScanBarcode },
      { label: 'Kategoriler', href: '/categories', icon: Tags },
      { label: 'Markalar', href: '/brands', icon: Award },
      { label: 'Tedarikçiler', href: '/suppliers', icon: Truck },
    ],
  },
  {
    title: 'Satış',
    items: [
      { label: 'Müşteriler', href: '/customers', icon: Users },
      { label: 'Satışlar', href: '/sales', icon: ShoppingCart },
      { label: 'Faturalar', href: '/invoices', icon: Receipt },
      { label: 'Teklifler', href: '/quotes', icon: FileText },
      { label: 'POS Ekranı', href: '/pos', icon: ClipboardList },
    ],
  },
  {
    title: 'Servis',
    items: [
      { label: 'Servis Takibi', href: '/service', icon: Wrench },
      { label: 'Tamir Takibi', href: '/service/repairs', icon: ShieldCheck },
      { label: 'Garanti Takibi', href: '/service/warranty', icon: ShieldCheck },
    ],
  },
  {
    title: 'Finans',
    items: [
      { label: 'Giderler', href: '/expenses', icon: CreditCard },
      { label: 'Gelirler', href: '/income', icon: Banknote },
      { label: 'Kasa', href: '/cash-register', icon: Banknote },
      { label: 'Banka Hesapları', href: '/bank-accounts', icon: Landmark },
      { label: 'Taksitler', href: '/installments', icon: CalendarClock },
    ],
  },
  {
    title: 'Analiz',
    items: [
      { label: 'Raporlar', href: '/reports', icon: BarChart3 },
      { label: 'Bildirimler', href: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Ayarlar', href: '/settings', icon: Settings },
      { label: 'Kullanıcı Yönetimi', href: '/users', icon: UserCog },
      { label: 'Roller ve İzinler', href: '/roles', icon: Lock },
      { label: 'Çoklu Şirket', href: '/companies', icon: Building2 },
      { label: 'Aktivite Logları', href: '/activity-logs', icon: History },
      { label: 'Yedekler', href: '/backups', icon: DatabaseBackup },
    ],
  },
];
