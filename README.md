# FOMUS GUILD

完全招待制・有料会員制のWebアプリケーション。

## 機能

- **完全招待制**: 招待コードを持つユーザーのみ登録可能
- **月額$10サブスクリプション**: Stripe連携による自動課金
- **デジタル会員証**: QRコード付きの会員証
- **グローバルマップ**: メンバーと枡拠点の位置表示
- **MASU Point & ランクシステム**: アクティビティに応じたポイント・ランク
- **Guild Offers**: ランクに応じた限定特典

---

## セットアップ手順

### 1. Supabaseプロジェクト作成

1. [Supabase](https://supabase.com) にアクセスしてアカウント作成
2. 「New Project」をクリック
3. プロジェクト名（例: `fomus-guild`）とデータベースパスワードを設定
4. リージョンを選択（ユーザーに近い場所推奨）
5. 「Create new project」をクリック

#### データベーススキーマの設定

1. Supabaseダッシュボード → 「SQL Editor」
2. `supabase/migrations/001_initial_schema.sql` の内容をコピー＆ペースト
3. 「Run」をクリックして実行

#### 認証設定

1. 「Authentication」→「Providers」
2. 「Email」が有効になっていることを確認
3. 「Confirm email」はオフ推奨（Magic Linkで確認済みのため）

#### APIキーの取得

1. 「Settings」→「API」
2. 以下をメモ:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`（**秘密にすること**）

---

### 2. Stripe商品作成

1. [Stripe Dashboard](https://dashboard.stripe.com) にログイン
2. テストモードであることを確認（右上のトグル）

#### 商品の作成

1. 「Products」→「Add product」
2. 設定:
   - Name: `FOMUS GUILD Monthly`
   - Pricing: `$10.00 USD` / `month` / `Recurring`
3. 「Save product」
4. 作成された Price ID（`price_xxx...`）をメモ → `STRIPE_PRICE_ID`

#### APIキーの取得

1. 「Developers」→「API keys」
2. 以下をメモ:
   - `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

---

### 3. Stripe Webhook設定

#### ローカル開発用

1. [Stripe CLI](https://stripe.com/docs/stripe-cli) をインストール
2. ログイン:
   ```bash
   stripe login
   ```
3. Webhookリスナーを起動:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. 表示された Webhook signing secret をメモ → `STRIPE_WEBHOOK_SECRET`

#### 本番用（Vercel等）

1. Stripe Dashboard →「Developers」→「Webhooks」
2. 「Add endpoint」
3. 設定:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
4. 作成後、「Signing secret」をメモ → `STRIPE_WEBHOOK_SECRET`

---

### 4. Google Maps API設定

1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. プロジェクトを作成または選択
3. 「APIs & Services」→「Library」
4. 以下のAPIを有効化:
   - Maps JavaScript API
   - Geocoding API
5. 「APIs & Services」→「Credentials」→「Create credentials」→「API key」
6. 作成されたAPIキーをメモ → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**推奨**: APIキーの制限を設定
- HTTP referrers（ウェブサイト）で制限
- 本番ドメインとlocalhostのみ許可

---

### 5. 環境変数の設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 6. Admin設定

最初のユーザー登録後、Supabase SQL Editorで実行:

```sql
-- メールアドレスで指定する場合
UPDATE profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```

または

```sql
-- ユーザーIDで指定する場合
UPDATE profiles SET role = 'admin' WHERE id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

---

### 7. ローカル起動

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセス

---

### 8. Vercelデプロイ

1. [Vercel](https://vercel.com) にログイン
2. 「Import Project」→ GitHubリポジトリを選択
3. 「Environment Variables」に全ての環境変数を設定
   - **注意**: `NEXT_PUBLIC_APP_URL` は本番URLに変更
4. 「Deploy」

デプロイ後:
- Stripe Webhookの本番エンドポイントを設定
- Google Maps APIのリファラー制限を更新

---

## 運用ガイド

### 招待コードの発行

1. Adminアカウントでログイン
2. Admin Panel → Invites タブ
3. 「Generate New Code」をクリック
4. 生成されたリンクを招待したい人に共有

### ポイント付与

1. Admin Panel → Members タブ
2. メンバーを選択
3. ポイント数とノート（任意）を入力
4. 「Add Points」をクリック

### 枡拠点の登録

1. Admin Panel → Hubs タブ
2. 「Add Hub」をクリック
3. 名前、説明、国、都市を入力
4. 「Create Hub」をクリック（座標は自動取得）

---

## ランクシステム

| Rank | 必要ポイント |
|------|-------------|
| D    | 0           |
| C    | 100         |
| B    | 300         |
| A    | 800         |

---

## トラブルシューティング

### Webhookが動作しない

- Stripe CLIが起動しているか確認
- `STRIPE_WEBHOOK_SECRET` が正しいか確認
- Stripeダッシュボードでイベントログを確認

### 地図が表示されない

- Google Maps APIキーが正しいか確認
- Maps JavaScript APIが有効か確認
- ブラウザのコンソールでエラーを確認

### ログインできない

- Supabaseの認証設定を確認
- メールプロバイダーの設定を確認
- Magic Linkメールが迷惑メールに入っていないか確認

---

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Supabase (Auth, Database, RLS)
- **決済**: Stripe Subscriptions
- **地図**: Google Maps JavaScript API
- **デプロイ**: Vercel推奨

---

## 注意事項

### ビルド時の日本語パス問題

Next.js 16のTurbopackは、プロジェクトパスに日本語などの非ASCII文字が含まれるとビルドエラーが発生する場合があります。

ビルドエラーが発生した場合は、プロジェクトをASCII文字のみのパスに移動してください：

```bash
# 例：日本語パスから移動
mv ~/Desktop/ギルドアプリ/fomus-guild ~/Desktop/fomus-guild
```

---

## あなたがやること（5項目）

1. **Supabase**: プロジェクト作成 → SQLスキーマ実行 → APIキー取得
2. **Stripe**: 商品作成（$10/月）→ APIキー取得 → Webhook設定
3. **Google Maps**: APIキー取得 → リファラー制限設定
4. **環境変数**: `.env.local` にすべてのキーを設定
5. **Admin設定**: 最初のユーザー登録後、SQLでrole = 'admin'に更新

以上で完了です。
