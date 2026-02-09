-- free_tier をsubscription_statusの許可値に追加
-- コード中で広く使われているがDB制約に含まれていなかった
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('inactive', 'active', 'past_due', 'canceled', 'free', 'free_tier'));
