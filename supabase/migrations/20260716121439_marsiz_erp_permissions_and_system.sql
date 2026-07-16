/*
# Marsiz ERP — Permission System, Enhanced Profiles, System Settings, Backups

## Overview
This migration adds a comprehensive per-module permission system, enhances user profiles
with username/phone/last_login/must_change_password, creates a system_settings table for
key-value configuration, and a backup_records table for tracking system backups.

## 1. Enhanced user_profiles
- Added columns: `username` (unique), `phone`, `last_login_at`, `must_change_password`
- Username allows login by username OR email
- `must_change_password` forces password change on first login

## 2. New Table: user_permissions
- Per-user, per-module permission flags (can_view, can_create, can_edit, can_delete)
- `module_key` references the module registry keys (dashboard, products, stock, etc.)
- Admins implicitly have all permissions (checked in code, not stored)
- One row per user per module

## 3. New Table: system_settings
- Key-value store for system configuration
- Stores: auto_backup_enabled, auto_backup_frequency, backup_retention_count,
  company_name, company_logo_url, etc.

## 4. New Table: backup_records
- Tracks each backup: filename, size, type (manual/auto), status, storage_path
- Links to Supabase Storage for the actual ZIP file

## 5. Security
- RLS enabled on all new tables
- user_permissions: users can read their own, admins can read/update all
- system_settings: admins can read/update, all authenticated can read
- backup_records: admin-only access
- Storage bucket 'backups' created for ZIP file storage
*/

-- ============ 1. Enhance user_profiles ============
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- ============ 2. user_permissions table ============
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_key)
);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own permissions
DROP POLICY IF EXISTS "select_own_permissions" ON user_permissions;
CREATE POLICY "select_own_permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- Admins can insert permissions for any user
DROP POLICY IF EXISTS "insert_permissions_admin" ON user_permissions;
CREATE POLICY "insert_permissions_admin"
  ON user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- Admins can update permissions for any user
DROP POLICY IF EXISTS "update_permissions_admin" ON user_permissions;
CREATE POLICY "update_permissions_admin"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- Admins can delete permissions
DROP POLICY IF EXISTS "delete_permissions_admin" ON user_permissions;
CREATE POLICY "delete_permissions_admin"
  ON user_permissions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- ============ 3. system_settings table ============
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
DROP POLICY IF EXISTS "select_settings" ON system_settings;
CREATE POLICY "select_settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update settings
DROP POLICY IF EXISTS "insert_settings_admin" ON system_settings;
CREATE POLICY "insert_settings_admin"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

DROP POLICY IF EXISTS "update_settings_admin" ON system_settings;
CREATE POLICY "update_settings_admin"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- ============ 4. backup_records table ============
CREATE TABLE IF NOT EXISTS backup_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  backup_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'completed',
  table_count integer NOT NULL DEFAULT 0,
  record_count bigint NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE backup_records ENABLE ROW LEVEL SECURITY;

-- Admin-only access for backup records
DROP POLICY IF EXISTS "select_backups_admin" ON backup_records;
CREATE POLICY "select_backups_admin"
  ON backup_records FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

DROP POLICY IF EXISTS "insert_backups_admin" ON backup_records;
CREATE POLICY "insert_backups_admin"
  ON backup_records FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

DROP POLICY IF EXISTS "update_backups_admin" ON backup_records;
CREATE POLICY "update_backups_admin"
  ON backup_records FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

DROP POLICY IF EXISTS "delete_backups_admin" ON backup_records;
CREATE POLICY "delete_backups_admin"
  ON backup_records FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- ============ 5. Insert default system settings ============
INSERT INTO system_settings (key, value, description) VALUES
  ('auto_backup_enabled', 'false', 'Otomatik yedekleme aktif/pasif'),
  ('auto_backup_frequency', 'daily', 'Yedekleme sıklığı: daily, weekly, monthly'),
  ('backup_retention_count', '20', 'Saklanacak yedek sayısı'),
  ('company_name', 'Marsiz ERP', 'Şirket adı'),
  ('company_tax_id', '', 'Vergi numarası'),
  ('company_address', '', 'Şirket adresi'),
  ('company_phone', '', 'Şirket telefonu'),
  ('company_email', '', 'Şirket e-postası'),
  ('company_logo_url', '', 'Şirket logosu URL'),
  ('company_currency', 'TRY', 'Varsayılan para birimi'),
  ('default_tax_rate', '20', 'Varsayılan KDV oranı (%)'),
  ('force_password_change', 'true', 'İlk girişte şifre değişikliği zorunlu mu')
ON CONFLICT (key) DO NOTHING;

-- ============ 6. Create storage bucket for backups ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for backups bucket (admin-only)
DROP POLICY IF EXISTS "backups_bucket_read_admin" ON storage.objects;
CREATE POLICY "backups_bucket_read_admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'backups' AND EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

DROP POLICY IF EXISTS "backups_bucket_write_admin" ON storage.objects;
CREATE POLICY "backups_bucket_write_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'backups' AND EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

DROP POLICY IF EXISTS "backups_bucket_update_admin" ON storage.objects;
CREATE POLICY "backups_bucket_update_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'backups' AND EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

DROP POLICY IF EXISTS "backups_bucket_delete_admin" ON storage.objects;
CREATE POLICY "backups_bucket_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'backups' AND EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- ============ 7. Update trigger for user_permissions ============
CREATE OR REPLACE FUNCTION update_user_permissions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_user_permissions_updated_at ON user_permissions;
CREATE TRIGGER trigger_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_permissions_updated_at();

-- ============ 8. RPC: Update last login ============
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE user_profiles SET last_login_at = now() WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.update_last_login() TO authenticated;

-- ============ 9. RPC: Get all user permissions for a user ============
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
RETURNS TABLE (
  module_key text,
  can_view boolean,
  can_create boolean,
  can_edit boolean,
  can_delete boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module_key, can_view, can_create, can_edit, can_delete
  FROM user_permissions
  WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;

-- ============ 10. RPC: Set user permissions (upsert) ============
CREATE OR REPLACE FUNCTION public.set_user_permission(
  p_user_id uuid,
  p_module_key text,
  p_can_view boolean DEFAULT false,
  p_can_create boolean DEFAULT false,
  p_can_edit boolean DEFAULT false,
  p_can_delete boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can set permissions
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  INSERT INTO user_permissions (user_id, module_key, can_view, can_create, can_edit, can_delete)
  VALUES (p_user_id, p_module_key, p_can_view, p_can_create, p_can_edit, p_can_delete)
  ON CONFLICT (user_id, module_key)
  DO UPDATE SET
    can_view = p_can_view,
    can_create = p_can_create,
    can_edit = p_can_edit,
    can_delete = p_can_delete,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_permission(uuid, text, boolean, boolean, boolean, boolean) TO authenticated;

-- ============ 11. RPC: Admin create user (with auto-approve) ============
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_username text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_role text DEFAULT 'user',
  p_must_change_password boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Only admins can create users
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('full_name', p_full_name)
  RETURNING id INTO new_user_id;

  -- Insert profile
  INSERT INTO user_profiles (id, email, full_name, username, phone, role, is_approved, is_active, must_change_password)
  VALUES (new_user_id, p_email, p_full_name, p_username, p_phone, p_role, true, true, p_must_change_password);

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text, text, boolean) TO authenticated;

-- ============ 12. RPC: Admin reset user password ============
CREATE OR REPLACE FUNCTION public.admin_reset_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;

  UPDATE user_profiles
  SET must_change_password = true
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;

-- ============ 13. RPC: Admin delete user ============
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Kendinizi silemezsiniz';
  END IF;

  DELETE FROM user_permissions WHERE user_id = p_user_id;
  DELETE FROM user_profiles WHERE id = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- ============ 14. RPC: Change own password ============
CREATE OR REPLACE FUNCTION public.change_own_password(
  p_current_password text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT encrypted_password INTO stored_hash FROM auth.users WHERE id = auth.uid();

  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı';
  END IF;

  IF NOT (stored_hash = crypt(p_current_password, stored_hash)) THEN
    RETURN false;
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = auth.uid();

  UPDATE user_profiles
  SET must_change_password = false
  WHERE id = auth.uid();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_own_password(text, text) TO authenticated;

-- ============ 15. RPC: Log activity ============
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action text,
  p_module text DEFAULT NULL,
  p_details text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name text;
BEGIN
  SELECT full_name INTO v_user_name FROM user_profiles WHERE id = auth.uid();

  INSERT INTO activity_logs (user_id, user_name, action, module, details)
  VALUES (auth.uid(), v_user_name, p_action, p_module, p_details);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity(text, text, text) TO authenticated;
