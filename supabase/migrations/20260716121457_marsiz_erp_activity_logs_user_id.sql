/*
# Marsiz ERP — Activity Logs Enhancement + Auto Admin Setup

## 1. Activity logs: add user_id column
- Links activity logs to auth.users for better tracking
- Indexed for performance

## 2. Auto admin setup RPC
- `auto_setup_admin()`: Creates the default admin account (admin@marsiz.com / admin123)
  ONLY if no admin exists. Sets must_change_password=true for forced password change.
  This replaces the manual /setup page flow with an automatic first-run experience.
*/

-- ============ 1. Add user_id to activity_logs ============
ALTER TABLE activity_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============ 2. Auto admin setup RPC ============
CREATE OR REPLACE FUNCTION public.auto_setup_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  new_user_id uuid;
BEGIN
  -- Check if any admin already exists
  SELECT COUNT(*) INTO admin_count
  FROM user_profiles
  WHERE role = 'admin' AND is_approved = true;

  IF admin_count > 0 THEN
    RETURN false;
  END IF;

  -- Create auth user with default credentials
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
    'admin@marsiz.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('full_name', 'Sistem Yöneticisi')
  RETURNING id INTO new_user_id;

  -- Create profile with admin role, approved, must change password
  INSERT INTO user_profiles (id, email, full_name, username, role, is_approved, is_active, must_change_password)
  VALUES (new_user_id, 'admin@marsiz.com', 'Sistem Yöneticisi', 'admin', 'admin', true, true, true);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_setup_admin() TO anon, authenticated;

-- ============ 3. Update log_activity to include user_id ============
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
