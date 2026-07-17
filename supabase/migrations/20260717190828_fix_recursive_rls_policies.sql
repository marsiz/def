/*
# Fix recursive RLS policies on user_profiles

## Root Cause
The `select_own_profile` and `update_own_profile` policies contain a subquery
that references `user_profiles` itself (`SELECT 1 FROM user_profiles p WHERE ...`).
This causes infinite recursion in PostgreSQL's RLS evaluation, which PostgREST
surfaces as "Database error querying schema".

## Fix
1. Create a SECURITY DEFINER function `is_current_user_admin()` that checks
   if the current auth.uid() is an admin — bypassing RLS.
2. Replace all recursive subqueries in user_profiles policies with calls to
   this function.
3. Also fix the same pattern in user_permissions, system_settings, backup_records,
   and storage.objects policies.
*/

-- ============ 1. Create is_current_user_admin() helper ============
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, anon;

-- ============ 2. Fix user_profiles policies ============
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_current_user_admin())
  WITH CHECK (auth.uid() = id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_profile_admin" ON user_profiles;
CREATE POLICY "delete_profile_admin" ON user_profiles
  FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

-- ============ 3. Fix user_permissions policies ============
DROP POLICY IF EXISTS "select_own_permissions" ON user_permissions;
CREATE POLICY "select_own_permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_current_user_admin());

DROP POLICY IF EXISTS "insert_permissions_admin" ON user_permissions;
CREATE POLICY "insert_permissions_admin"
  ON user_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "update_permissions_admin" ON user_permissions;
CREATE POLICY "update_permissions_admin"
  ON user_permissions FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "delete_permissions_admin" ON user_permissions;
CREATE POLICY "delete_permissions_admin"
  ON user_permissions FOR DELETE
  TO authenticated
  USING (public.is_current_user_admin());

-- ============ 4. Fix system_settings policies ============
DROP POLICY IF EXISTS "insert_settings_admin" ON system_settings;
CREATE POLICY "insert_settings_admin"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "update_settings_admin" ON system_settings;
CREATE POLICY "update_settings_admin"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ============ 5. Fix backup_records policies ============
DROP POLICY IF EXISTS "select_backups_admin" ON backup_records;
CREATE POLICY "select_backups_admin"
  ON backup_records FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "insert_backups_admin" ON backup_records;
CREATE POLICY "insert_backups_admin"
  ON backup_records FOR INSERT
  TO authenticated
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "update_backups_admin" ON backup_records;
CREATE POLICY "update_backups_admin"
  ON backup_records FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP POLICY IF EXISTS "delete_backups_admin" ON backup_records;
CREATE POLICY "delete_backups_admin"
  ON backup_records FOR DELETE
  TO authenticated
  USING (public.is_current_user_admin());

-- ============ 6. Fix storage.objects policies for backups bucket ============
DROP POLICY IF EXISTS "backups_bucket_read_admin" ON storage.objects;
CREATE POLICY "backups_bucket_read_admin"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'backups' AND public.is_current_user_admin());

DROP POLICY IF EXISTS "backups_bucket_write_admin" ON storage.objects;
CREATE POLICY "backups_bucket_write_admin"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'backups' AND public.is_current_user_admin());

DROP POLICY IF EXISTS "backups_bucket_update_admin" ON storage.objects;
CREATE POLICY "backups_bucket_update_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'backups' AND public.is_current_user_admin());

DROP POLICY IF EXISTS "backups_bucket_delete_admin" ON storage.objects;
CREATE POLICY "backups_bucket_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'backups' AND public.is_current_user_admin());

-- ============ 7. Reload PostgREST schema cache ============
NOTIFY pgrst, 'reload schema';
