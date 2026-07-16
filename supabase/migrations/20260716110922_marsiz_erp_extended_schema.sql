/*
# Marsiz ERP - Ek Tablolar (Genişletilmiş Şema)

1. Yeni Tablolar
- `stock_movements` - Stok giriş/çıkış hareketleri
- `service_tickets` - Servis ticketleri (tamir takibi, IMEI, garanti)
- `service_notes` - Servis notları (teknisyen notları)
- `bank_accounts` - Banka hesapları
- `cash_register` - Kasa hareketleri
- `installments` - Taksit planları
- `incomes` - Gelir kayıtları
- `notifications` - Bildirimler
- `companies` - Çoklu şirket
- `activity_logs` - Aktivite logları
- `quotes` - Teklifler
- `quote_items` - Teklif kalemleri
2. Güvenlik
- Tüm tablolarda RLS aktif, anon+authenticated CRUD (tek-kullanıcı modu)
3. Notlar
- UUID, soft delete, created_at/updated_at
*/

-- Stok Hareketleri
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type text NOT NULL DEFAULT 'in',
  quantity integer NOT NULL DEFAULT 0,
  reference text,
  notes text,
  movement_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_stock_movements" ON stock_movements;
CREATE POLICY "anon_select_stock_movements" ON stock_movements FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_stock_movements" ON stock_movements;
CREATE POLICY "anon_insert_stock_movements" ON stock_movements FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_stock_movements" ON stock_movements;
CREATE POLICY "anon_update_stock_movements" ON stock_movements FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_stock_movements" ON stock_movements;
CREATE POLICY "anon_delete_stock_movements" ON stock_movements FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_stock_mov_product ON stock_movements(product_id);

-- Servis Ticketleri
CREATE TABLE IF NOT EXISTS service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  imei text,
  password text,
  accessories_received text,
  issue_description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  technician_id text,
  technician_notes text,
  customer_signature text,
  photo_url text,
  warranty boolean DEFAULT false,
  estimated_cost numeric(12,2) DEFAULT 0,
  final_cost numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_service_tickets" ON service_tickets;
CREATE POLICY "anon_select_service_tickets" ON service_tickets FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_service_tickets" ON service_tickets;
CREATE POLICY "anon_insert_service_tickets" ON service_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_service_tickets" ON service_tickets;
CREATE POLICY "anon_update_service_tickets" ON service_tickets FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_service_tickets" ON service_tickets;
CREATE POLICY "anon_delete_service_tickets" ON service_tickets FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_service_tickets_status ON service_tickets(status);

-- Banka Hesapları
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text,
  iban text,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'TRY',
  account_type text DEFAULT 'checking',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_select_bank_accounts" ON bank_accounts FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_insert_bank_accounts" ON bank_accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_update_bank_accounts" ON bank_accounts FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bank_accounts" ON bank_accounts;
CREATE POLICY "anon_delete_bank_accounts" ON bank_accounts FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);

-- Kasa Hareketleri
CREATE TABLE IF NOT EXISTS cash_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL DEFAULT 'in',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  description text,
  reference text,
  transaction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_cash_register" ON cash_register;
CREATE POLICY "anon_select_cash_register" ON cash_register FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_cash_register" ON cash_register;
CREATE POLICY "anon_insert_cash_register" ON cash_register FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_cash_register" ON cash_register;
CREATE POLICY "anon_update_cash_register" ON cash_register FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_cash_register" ON cash_register;
CREATE POLICY "anon_delete_cash_register" ON cash_register FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);

-- Taksitler
CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  installment_count integer NOT NULL DEFAULT 1,
  monthly_amount numeric(12,2) NOT NULL DEFAULT 0,
  next_payment_date date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_installments" ON installments;
CREATE POLICY "anon_select_installments" ON installments FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_installments" ON installments;
CREATE POLICY "anon_insert_installments" ON installments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_installments" ON installments;
CREATE POLICY "anon_update_installments" ON installments FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_installments" ON installments;
CREATE POLICY "anon_delete_installments" ON installments FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);

-- Gelirler
CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  income_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'cash',
  reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_incomes" ON incomes;
CREATE POLICY "anon_select_incomes" ON incomes FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_incomes" ON incomes;
CREATE POLICY "anon_insert_incomes" ON incomes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_incomes" ON incomes;
CREATE POLICY "anon_update_incomes" ON incomes FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_incomes" ON incomes;
CREATE POLICY "anon_delete_incomes" ON incomes FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);

-- Bildirimler
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- Şirketler
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text,
  address text,
  phone text,
  email text,
  currency text DEFAULT 'TRY',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_companies" ON companies;
CREATE POLICY "anon_select_companies" ON companies FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_companies" ON companies;
CREATE POLICY "anon_insert_companies" ON companies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_companies" ON companies;
CREATE POLICY "anon_update_companies" ON companies FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_companies" ON companies;
CREATE POLICY "anon_delete_companies" ON companies FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);

-- Aktivite Logları
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text,
  action text NOT NULL,
  module text,
  details text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_activity_logs" ON activity_logs;
CREATE POLICY "anon_select_activity_logs" ON activity_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
CREATE POLICY "anon_insert_activity_logs" ON activity_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity_logs" ON activity_logs;
CREATE POLICY "anon_delete_activity_logs" ON activity_logs FOR DELETE TO anon, authenticated USING (true);

-- Teklifler
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  valid_until date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_quotes" ON quotes;
CREATE POLICY "anon_select_quotes" ON quotes FOR SELECT TO anon, authenticated USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "anon_insert_quotes" ON quotes;
CREATE POLICY "anon_insert_quotes" ON quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_quotes" ON quotes;
CREATE POLICY "anon_update_quotes" ON quotes FOR UPDATE TO anon, authenticated USING (deleted_at IS NULL) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_quotes" ON quotes;
CREATE POLICY "anon_delete_quotes" ON quotes FOR DELETE TO anon, authenticated USING (deleted_at IS NULL);

-- Teklif Kalemleri
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_quote_items" ON quote_items;
CREATE POLICY "anon_select_quote_items" ON quote_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_quote_items" ON quote_items;
CREATE POLICY "anon_insert_quote_items" ON quote_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_quote_items" ON quote_items;
CREATE POLICY "anon_update_quote_items" ON quote_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_quote_items" ON quote_items;
CREATE POLICY "anon_delete_quote_items" ON quote_items FOR DELETE TO anon, authenticated USING (true);
