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
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', href: '/products', icon: Package },
      { label: 'Stock Management', href: '/stock', icon: Warehouse },
      { label: 'Barcode', href: '/barcode', icon: ScanBarcode },
      { label: 'Categories', href: '/categories', icon: Tags },
      { label: 'Brands', href: '/brands', icon: Award },
      { label: 'Suppliers', href: '/suppliers', icon: Truck },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Customers', href: '/customers', icon: Users },
      { label: 'Sales', href: '/sales', icon: ShoppingCart },
      { label: 'Invoices', href: '/invoices', icon: Receipt },
      { label: 'Quotes', href: '/quotes', icon: FileText },
      { label: 'POS Screen', href: '/pos', icon: ClipboardList },
    ],
  },
  {
    title: 'Service',
    items: [
      { label: 'Service Tracking', href: '/service', icon: Wrench },
      { label: 'Repair Tracking', href: '/service/repairs', icon: ShieldCheck },
      { label: 'Warranty Tracking', href: '/service/warranty', icon: ShieldCheck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Expenses', href: '/expenses', icon: CreditCard },
      { label: 'Income', href: '/income', icon: Banknote },
      { label: 'Cash Register', href: '/cash-register', icon: Banknote },
      { label: 'Bank Accounts', href: '/bank-accounts', icon: Landmark },
      { label: 'Installments', href: '/installments', icon: CalendarClock },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3 },
      { label: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'User Management', href: '/users', icon: UserCog },
      { label: 'Roles & Permissions', href: '/roles', icon: Lock },
      { label: 'Multi Company', href: '/companies', icon: Building2 },
      { label: 'Activity Logs', href: '/activity-logs', icon: History },
      { label: 'Backups', href: '/backups', icon: DatabaseBackup },
    ],
  },
];
