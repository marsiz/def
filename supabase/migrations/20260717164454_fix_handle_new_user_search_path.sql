/*
# Fix handle_new_user SECURITY DEFINER search_path

1. Security Changes
   - The `handle_new_user()` trigger function is SECURITY DEFINER but has no `search_path` set.
   - Supabase/PostgREST requires all SECURITY DEFINER functions to have `search_path` configured,
     otherwise schema introspection fails with "Database error querying schema".
   - This migration sets `search_path = public, extensions` on `handle_new_user()`.

2. Notes
   - This is a non-destructive change — only alters the function's configuration, not its logic.
   - The trigger itself is not modified.
*/

ALTER FUNCTION public.handle_new_user() SET search_path TO 'public', 'extensions';
