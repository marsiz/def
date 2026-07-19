export type UUID = string;

export interface Category {
  id: UUID;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Brand {
  id: UUID;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Supplier {
  id: UUID;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Product {
  id: UUID;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: UUID | null;
  brand_id: UUID | null;
  supplier_id: UUID | null;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  has_serial_tracking: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: Category | null;
  brand?: Brand | null;
  supplier?: Supplier | null;
}

export interface Customer {
  id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  tax_id: string | null;
  balance: number;
  credit_limit: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SaleItem {
  id: UUID;
  sale_id: UUID;
  product_id: UUID | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
}

export interface Sale {
  id: UUID;
  invoice_number: string;
  customer_id: UUID | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_method: string;
  notes: string | null;
  sale_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: Customer | null;
  sale_items?: SaleItem[];
}

export interface Expense {
  id: UUID;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  payment_method: string;
  reference: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StockMovement {
  id: UUID;
  product_id: UUID;
  movement_type: string;
  quantity: number;
  reference: string | null;
  notes: string | null;
  movement_date: string;
  created_at: string;
  deleted_at: string | null;
  product?: Product | null;
}

export interface ServiceTicket {
  id: UUID;
  ticket_number: string;
  customer_id: UUID | null;
  product_name: string;
  imei: string | null;
  password: string | null;
  accessories_received: string | null;
  issue_description: string;
  status: string;
  technician_id: string | null;
  technician_notes: string | null;
  customer_signature: string | null;
  photo_url: string | null;
  warranty: boolean;
  estimated_cost: number;
  final_cost: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: Customer | null;
}

export interface BankAccount {
  id: UUID;
  bank_name: string;
  account_name: string;
  account_number: string | null;
  iban: string | null;
  balance: number;
  currency: string;
  account_type: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CashTransaction {
  id: UUID;
  transaction_type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Installment {
  id: UUID;
  sale_id: UUID | null;
  customer_id: UUID | null;
  total_amount: number;
  paid_amount: number;
  installment_count: number;
  monthly_amount: number;
  next_payment_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: Customer | null;
}

export interface Income {
  id: UUID;
  source: string;
  description: string | null;
  amount: number;
  income_date: string;
  payment_method: string;
  reference: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Notification {
  id: UUID;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Company {
  id: UUID;
  name: string;
  tax_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ActivityLog {
  id: UUID;
  user_name: string | null;
  action: string;
  module: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface Quote {
  id: UUID;
  quote_number: string;
  customer_id: UUID | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: Customer | null;
}

export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  expenses: number;
  profit: number;
  outstandingPayments: number;
  customerCount: number;
  stockValue: number;
  lowStockCount: number;
  todayPct: { change: string; trend: 'up' | 'down' };
  monthSalesPct: { change: string; trend: 'up' | 'down' };
  expensesPct: { change: string; trend: 'up' | 'down' };
  profitPct: { change: string; trend: 'up' | 'down' };
  customerPct: { change: string; trend: 'up' | 'down' };
  topProducts: { name: string; quantity: number; revenue: number }[];
  latestOrders: (Sale & { customer?: Customer | null })[];
  revenueData: { date: string; revenue: number; expenses: number; profit: number }[];
  salesByCategory: { name: string; value: number }[];
  cashFlowData: { date: string; inflow: number; outflow: number }[];
}
