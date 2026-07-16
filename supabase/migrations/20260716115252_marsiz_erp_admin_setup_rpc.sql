/*
# Admin Setup RPC Function

1. New Functions
- `promote_first_admin()`: A SECURITY DEFINER function that promotes the calling user
  to admin + approved ONLY IF no admin user currently exists in user_profiles.
  If an admin already exists, it returns an error. This makes the /setup page
  self-locking: the first user to call it becomes admin, all subsequent calls fail.
- `get_admin_exists()`: Returns true if any admin user exists, false otherwise.
  Used by the setup page to hide itself once an admin has been created.

2. Security
- Both functions run as SECURITY DEFINER to bypass RLS during the check.
- `promote_first_admin` only succeeds when zero admin rows exist, preventing privilege escalation.
- `get_admin_exists` is safe to expose to anon/authenticated — it returns only a boolean.
*/

-- Function to promote the first user to admin (only if no admin exists)
CREATE OR REPLACE FUNCTION public.promote_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM public.user_profiles
  WHERE role = 'admin' AND is_approved = true;

  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin kullanıcı zaten mevcut. İlk kurulum tamamlanmış.';
  END IF;

  UPDATE public.user_profiles
  SET role = 'admin', is_approved = true, is_active = true, updated_at = now()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kullanıcı profili bulunamadı.';
  END IF;

  RETURN true;
END;
$$;

-- Function to check if any admin exists (safe for anon access)
CREATE OR REPLACE FUNCTION public.get_admin_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE role = 'admin' AND is_approved = true
  );
$$;

-- Grant access to both functions
GRANT EXECUTE ON FUNCTION public.promote_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_exists() TO anon, authenticated;
