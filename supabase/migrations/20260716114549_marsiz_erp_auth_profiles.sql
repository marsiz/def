/*
# Marsiz ERP - Kullanıcı Profil ve Yetki Sistemi

1. Yeni Tablolar
- `user_profiles` - Kullanıcı profil ve yetki bilgileri
  - `id` (uuid, auth.users'a referans)
  - `email` (text)
  - `full_name` (text)
  - `role` (text: 'admin' veya 'user')
  - `is_approved` (boolean: admin onayı)
  - `is_active` (boolean: hesap aktif mi)
  - `created_at`, `updated_at`

2. Güvenlik
- RLS aktif
- Kullanıcılar kendi profillerini görebilir
- Admin tüm profilleri görebilir/düzenleyebilir
- Admin onaylamadan kullanıcı sisteme giremez

3. Notlar
- Admin kullanıcısı manuel olarak oluşturulacak
- is_approved = false olan kullanıcılar erişemez
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  is_approved boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi profilini görebilir
DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- Kullanıcı kendi profilini güncelleyebilir (sadece full_name)
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- Yeni kayıt olan kullanıcı kendi profilini oluşturabilir
DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admin profilleri silebilir
DROP POLICY IF EXISTS "delete_profile_admin" ON user_profiles;
CREATE POLICY "delete_profile_admin" ON user_profiles
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_approved = true
  ));

-- Trigger: Yeni auth kullanıcısı oluşturulduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role, is_approved, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    false,
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at_user_profiles ON user_profiles;
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
