/*
# Fix auto_setup_admin: explicitly generate UUID for auth.users.id
- auth.users.id doesn't auto-generate in some Supabase versions
- Using gen_random_uuid() explicitly
*/

CREATE OR REPLACE FUNCTION public.auto_setup_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  admin_count integer;
  new_user_id uuid;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role = 'admin' AND is_approved = true;

  IF admin_count > 0 THEN
    RETURN false;
  END IF;

  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  SELECT
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@marsiz.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', 'Sistem Yöneticisi');

  INSERT INTO public.user_profiles (id, email, full_name, username, role, is_approved, is_active, must_change_password)
  VALUES (new_user_id, 'admin@marsiz.com', 'Sistem Yöneticisi', 'admin', 'admin', true, true, true);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_setup_admin() TO anon, authenticated;

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
SET search_path TO public, extensions
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  SELECT
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name);

  INSERT INTO public.user_profiles (id, email, full_name, username, phone, role, is_approved, is_active, must_change_password)
  VALUES (new_user_id, p_email, p_full_name, p_username, p_phone, p_role, true, true, p_must_change_password);

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text, text, boolean) TO authenticated;
