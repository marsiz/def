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

export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  expenses: number;
  profit: number;
  outstandingPayments: number;
  customerCount: number;
  stockValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  latestOrders: (Sale & { customer?: Customer | null })[];
  revenueData: { date: string; revenue: number; expenses: number; profit: number }[];
  salesByCategory: { name: string; value: number }[];
  cashFlowData: { date: string; inflow: number; outflow: number }[];
}
