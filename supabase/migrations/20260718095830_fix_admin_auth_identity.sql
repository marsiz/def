-- Fix: admin user has no entry in auth.identities, which GoTrue requires for login.
-- The auto_setup_admin function inserted into auth.users but not auth.identities.
-- Note: auth.identities.email is a GENERATED column from identity_data->>'email'.

-- 1. Create the missing identity for the existing admin user
INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT
  'admin@marsiz.com',
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.last_sign_in_at,
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.email = 'admin@marsiz.com'
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
)
ON CONFLICT DO NOTHING;

-- 2. Update auto_setup_admin to also create the identity row for future setups
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

  -- Create the required auth.identities row (email column is generated)
  INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  VALUES (
    'admin@marsiz.com',
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'admin@marsiz.com', 'email_verified', true),
    'email',
    now(), now()
  );

  -- The trigger creates a default profile; update it to admin
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
