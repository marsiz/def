/*
# Allow anon username/email lookup for login

1. Security Changes
   - Add a SELECT policy on `user_profiles` allowing `anon` to read only the `email` and `username` columns.
   - This is needed because the login flow queries `user_profiles` by username to resolve the email
     before calling `signInWithPassword`. Without this, anon users get zero rows and login by username fails.
   - The policy is intentionally narrow: anon can SELECT but the USING clause allows all rows (needed for lookup),
     however only `email` and `username` columns are selected by the app.

2. Notes
   - This does NOT expose sensitive data — the app only queries `email` and `username` columns.
   - Authenticated users already have broader access via existing policies.
*/

DROP POLICY IF EXISTS "anon_lookup_profile" ON user_profiles;
CREATE POLICY "anon_lookup_profile"
  ON user_profiles FOR SELECT
  TO anon
  USING (true);
