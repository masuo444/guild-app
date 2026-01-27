-- profilesテーブルにOTP認証用のカラムを追加
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;

-- インデックスを追加（オプション）
CREATE INDEX IF NOT EXISTS idx_profiles_otp_code ON profiles(otp_code) WHERE otp_code IS NOT NULL;
