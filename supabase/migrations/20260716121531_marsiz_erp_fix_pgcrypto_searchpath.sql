/*
# Fix auto_setup_admin and admin_create_user search_path
- pgcrypto functions (gen_salt, crypt) are in the `extensions` schema
- Updated SECURITY DEFINER functions to include `extensions` in search_path
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

  INSERT INTO public.user_profiles (id, email, full_name, username, phone, role, is_approved, is_active, must_change_password)
  VALUES (new_user_id, p_email, p_full_name, p_username, p_phone, p_role, true, true, p_must_change_password);

  RETURN new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text, text, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  ) THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;

  UPDATE public.user_profiles
  SET must_change_password = true
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.change_own_password(
  p_current_password text,
  p_new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
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

  UPDATE public.user_profiles
  SET must_change_password = false
  WHERE id = auth.uid();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_own_password(text, text) TO authenticated;
