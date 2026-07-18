-- Fix: admin user's auth.identities.provider_id was set to email instead of UUID.
-- GoTrue expects provider_id = user UUID for email provider.
-- This was causing "Database error querying schema" on login.

UPDATE auth.identities
SET provider_id = '9f44d100-9f08-4322-832e-ea0df75e418e',
    identity_data = jsonb_build_object(
      'sub', '9f44d100-9f08-4322-832e-ea0df75e418e',
      'email', 'admin@marsiz.com',
      'email_verified', true,
      'phone_verified', false
    )
WHERE user_id = '9f44d100-9f08-4322-832e-ea0df75e418e'
  AND provider = 'email';

-- Also fix auto_setup_admin to use UUID as provider_id
CREATE OR REPLACE FUNCTION public.auto_setup_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $function$
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
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  )
  SELECT
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@marsiz.com',
    crypt('admin123', gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', 'Sistem Yöneticisi');

  -- Create the required auth.identities row with UUID as provider_id
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'admin@marsiz.com', 'email_verified', true, 'phone_verified', false),
    'email',
    now(), now()
  );

  INSERT INTO public.user_profiles (id, email, full_name, username, role, is_approved, is_active, must_change_password)
  VALUES (new_user_id, 'admin@marsiz.com', 'Sistem Yöneticisi', 'admin', 'admin', true, true, true)
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

NOTIFY pgrst, 'reload schema';
