-- =============================================
-- 有料入会の紹介報酬（初回のみ）
-- 登録時の Invite Bonus 100pt とは別枠。Stripeの課金成立時に付与される。
-- 金額を変えたい時はこの行の value を更新する（デプロイ不要）。
-- =============================================
INSERT INTO app_settings (key, value)
VALUES ('referral_signup_points', '1000')
ON CONFLICT (key) DO NOTHING;
