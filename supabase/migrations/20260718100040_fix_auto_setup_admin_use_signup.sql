-- Update auto_setup_admin to NOT directly insert into auth.users/identities.
-- Direct inserts break GoTrue's internal state. Instead, this function now only
-- sets up the profile after the user is created via GoTrue's signup endpoint.
-- The setup page should call auth signup first, then promote via RPC.

CREATE OR REPLACE FUNCTION public.auto_setup_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  admin_count integer;
  admin_user record;
BEGIN
  -- Check if an approved admin already exists
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role = 'admin' AND is_approved = true;

  IF admin_count > 0 THEN
    RETURN false;
  END IF;

  -- Find the admin@marsiz.com user (created via GoTrue signup)
  SELECT u.id, u.email INTO admin_user
  FROM auth.users u
  WHERE u.email = 'admin@marsiz.com'
  LIMIT 1;

  IF admin_user.id IS NULL THEN
    RETURN false;
  END IF;

  -- Upsert the profile as admin
  INSERT INTO public.user_profiles (id, email, full_name, username, role, is_approved, is_active, must_change_password)
  VALUES (admin_user.id, admin_user.email, 'Sistem Yöneticisi', 'admin', 'admin', true, true, true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    is_approved = EXCLUDED.is_approved,
    is_active = EXCLUDED.is_active,
    must_change_password = EXCLUDED.must_change_password,
    updated_at = now();

  RETURN true;
END;
$function$;

-- Also update admin_create_user to not directly insert into auth.users.
-- It should be replaced with a flow that uses GoTrue's admin API.
-- For now, update it to create the user via auth.users but ALSO create identity properly.
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $function$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Yetkisiz';
  END IF;

  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  )
  SELECT
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name);

  -- Create identity with UUID as provider_id (matching GoTrue's format)
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
    'email',
    now(), now()
  );

  INSERT INTO public.user_profiles (id, email, full_name, role, is_approved, is_active, must_change_password)
  VALUES (new_user_id, p_email, p_full_name, p_role, true, true, true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_approved = EXCLUDED.is_approved,
    is_active = EXCLUDED.is_active,
    updated_at = now();

  RETURN new_user_id;
END;
$function$;

NOTIFY pgrst, 'reload schema';
