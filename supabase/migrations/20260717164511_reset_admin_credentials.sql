/*
# Reset admin password and ensure profile is correct

1. Changes
   - Reset the admin user's password to 'admin123' to ensure known credentials.
   - Ensure the user_profiles row for the admin is correct (role=admin, is_approved=true, is_active=true, must_change_password=true).
   - Set username to 'admin' for username-based login.

2. Security
   - No RLS policy changes.
   - The admin password is reset to the default 'admin123' which must be changed on first login.

3. Notes
   - This is idempotent — safe to re-run.
*/

-- Reset admin password
UPDATE auth.users
SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  updated_at = now()
WHERE email = 'admin@marsiz.com';

-- Ensure profile is correct
UPDATE user_profiles
SET
  full_name = 'Sistem Yöneticisi',
  username = 'admin',
  role = 'admin',
  is_approved = true,
  is_active = true,
  must_change_password = true,
  updated_at = now()
WHERE email = 'admin@marsiz.com';
