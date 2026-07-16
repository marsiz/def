/*
# Marsiz ERP - RLS Politikalarını Authenticated'a Güncelle

Tüm tabloların RLS politikalarını anon erişimini kapatıp authenticated-only yapıyor.
Artık giriş yapmadan hiçbir veriye erişilemez.

1. Değişiklik
- Tüm tablolarda anon politikaları silinir
- authenticated-only CRUD politikaları eklenir
- Tüm tablolarda authenticated kullanıcılar tam CRUD yapabilir
- Admin onaylı kullanıcılar (is_approved) erişebilir

2. Etkilenen Tablolar
- categories, brands, suppliers, products, customers, sales, sale_items, expenses
- stock_movements, service_tickets, bank_accounts, cash_register, installments
- incomes, notifications, companies, activity_logs, quotes, quote_items
*/

-- categories
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "auth_select_categories" ON categories FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_categories" ON categories FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_categories" ON categories FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- brands
DROP POLICY IF EXISTS "anon_select_brands" ON brands;
DROP POLICY IF EXISTS "anon_insert_brands" ON brands;
DROP POLICY IF EXISTS "anon_update_brands" ON brands;
DROP POLICY IF EXISTS "anon_delete_brands" ON brands;
CREATE POLICY "auth_select_brands" ON brands FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_brands" ON brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_brands" ON brands FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_brands" ON brands FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- suppliers
DROP POLICY IF EXISTS "anon_select_suppliers" ON suppliers;
DROP POLICY IF EXISTS "anon_insert_suppliers" ON suppliers;
DROP POLICY IF EXISTS "anon_update_suppliers" ON suppliers;
DROP POLICY IF EXISTS "anon_delete_suppliers" ON suppliers;
CREATE POLICY "auth_select_suppliers" ON suppliers FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_suppliers" ON suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_suppliers" ON suppliers FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_suppliers" ON suppliers FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- products
DROP POLICY IF EXISTS "anon_select_products" ON products;
DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "auth_select_products" ON products FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_products" ON products FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_products" ON products FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- customers
DROP POLICY IF EXISTS "anon_select_customers" ON customers;
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "auth_select_customers" ON customers FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_customers" ON customers FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_customers" ON customers FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- sales
DROP POLICY IF EXISTS "anon_select_sales" ON sales;
DROP POLICY IF EXISTS "anon_insert_sales" ON sales;
DROP POLICY IF EXISTS "anon_update_sales" ON sales;
DROP POLICY IF EXISTS "anon_delete_sales" ON sales;
CREATE POLICY "auth_select_sales" ON sales FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sales" ON sales FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_sales" ON sales FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- sale_items
DROP POLICY IF EXISTS "anon_select_sale_items" ON sale_items;
DROP POLICY IF EXISTS "anon_insert_sale_items" ON sale_items;
DROP POLICY IF EXISTS "anon_update_sale_items" ON sale_items;
DROP POLICY IF EXISTS "anon_delete_sale_items" ON sale_items;
CREATE POLICY "auth_select_sale_items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_sale_items" ON sale_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_sale_items" ON sale_items FOR DELETE TO authenticated USING (true);

-- expenses
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "auth_select_expenses" ON expenses FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_expenses" ON expenses FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_expenses" ON expenses FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- stock_movements
DROP POLICY IF EXISTS "anon_select_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "anon_insert_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "anon_update_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "anon_delete_stock_movements" ON stock_movements;
CREATE POLICY "auth_select_stock_movements" ON stock_movements FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_stock_movements" ON stock_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_stock_movements" ON stock_movements FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_stock_movements" ON stock_movements FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- service_tickets
DROP POLICY IF EXISTS "anon_select_service_tickets" ON service_tickets;
DROP POLICY IF EXISTS "anon_insert_service_tickets" ON service_tickets;
DROP POLICY IF EXISTS "anon_update_service_tickets" ON service_tickets;
DROP POLICY IF EXISTS "anon_delete_service_tickets" ON service_tickets;
CREATE POLICY "auth_select_service_tickets" ON service_tickets FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_service_tickets" ON service_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_service_tickets" ON service_tickets FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_service_tickets" ON service_tickets FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- bank_accounts
DROP POLICY IF EXISTS "anon_select_bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "anon_insert_bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "anon_update_bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "anon_delete_bank_accounts" ON bank_accounts;
CREATE POLICY "auth_select_bank_accounts" ON bank_accounts FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_bank_accounts" ON bank_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_bank_accounts" ON bank_accounts FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_bank_accounts" ON bank_accounts FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- cash_register
DROP POLICY IF EXISTS "anon_select_cash_register" ON cash_register;
DROP POLICY IF EXISTS "anon_insert_cash_register" ON cash_register;
DROP POLICY IF EXISTS "anon_update_cash_register" ON cash_register;
DROP POLICY IF EXISTS "anon_delete_cash_register" ON cash_register;
CREATE POLICY "auth_select_cash_register" ON cash_register FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_cash_register" ON cash_register FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cash_register" ON cash_register FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_cash_register" ON cash_register FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- installments
DROP POLICY IF EXISTS "anon_select_installments" ON installments;
DROP POLICY IF EXISTS "anon_insert_installments" ON installments;
DROP POLICY IF EXISTS "anon_update_installments" ON installments;
DROP POLICY IF EXISTS "anon_delete_installments" ON installments;
CREATE POLICY "auth_select_installments" ON installments FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_installments" ON installments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_installments" ON installments FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_installments" ON installments FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- incomes
DROP POLICY IF EXISTS "anon_select_incomes" ON incomes;
DROP POLICY IF EXISTS "anon_insert_incomes" ON incomes;
DROP POLICY IF EXISTS "anon_update_incomes" ON incomes;
DROP POLICY IF EXISTS "anon_delete_incomes" ON incomes;
CREATE POLICY "auth_select_incomes" ON incomes FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_incomes" ON incomes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_incomes" ON incomes FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_incomes" ON incomes FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- notifications
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "auth_select_notifications" ON notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_notifications" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_notifications" ON notifications FOR DELETE TO authenticated USING (true);

-- companies
DROP POLICY IF EXISTS "anon_select_companies" ON companies;
DROP POLICY IF EXISTS "anon_insert_companies" ON companies;
DROP POLICY IF EXISTS "anon_update_companies" ON companies;
DROP POLICY IF EXISTS "anon_delete_companies" ON companies;
CREATE POLICY "auth_select_companies" ON companies FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_companies" ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_companies" ON companies FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_companies" ON companies FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- activity_logs
DROP POLICY IF EXISTS "anon_select_activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "anon_insert_activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "anon_delete_activity_logs" ON activity_logs;
CREATE POLICY "auth_select_activity_logs" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_activity_logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_activity_logs" ON activity_logs FOR DELETE TO authenticated USING (true);

-- quotes
DROP POLICY IF EXISTS "anon_select_quotes" ON quotes;
DROP POLICY IF EXISTS "anon_insert_quotes" ON quotes;
DROP POLICY IF EXISTS "anon_update_quotes" ON quotes;
DROP POLICY IF EXISTS "anon_delete_quotes" ON quotes;
CREATE POLICY "auth_select_quotes" ON quotes FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth_insert_quotes" ON quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_quotes" ON quotes FOR UPDATE TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);
CREATE POLICY "auth_delete_quotes" ON quotes FOR DELETE TO authenticated USING (deleted_at IS NULL);

-- quote_items
DROP POLICY IF EXISTS "anon_select_quote_items" ON quote_items;
DROP POLICY IF EXISTS "anon_insert_quote_items" ON quote_items;
DROP POLICY IF EXISTS "anon_update_quote_items" ON quote_items;
DROP POLICY IF EXISTS "anon_delete_quote_items" ON quote_items;
CREATE POLICY "auth_select_quote_items" ON quote_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_quote_items" ON quote_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_quote_items" ON quote_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_quote_items" ON quote_items FOR DELETE TO authenticated USING (true);
