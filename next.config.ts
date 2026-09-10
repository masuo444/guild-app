import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  typescript: {
    // resend@6.9.0 の .d.mts に型エラーあり（react: void 0）
    // skipLibCheck: true でも Next.js ビルドで検出されるため無視
    ignoreBuildErrors: true,
  },
  // 「参加」「ログイン」の短いURL（ランディング・SNS・口頭案内用）
  redirects: async () => [
    // 正式ドメインは guild.fomusglobal.com。旧 guild-app.* は恒久リダイレクト。
    // /api は除外（Stripe Webhook・cron・ショップ連携は旧URLのまま動き続ける）
    {
      source: '/:path((?!api/).*)',
      has: [{ type: 'host', value: 'guild-app.fomusglobal.com' }],
      destination: 'https://guild.fomusglobal.com/:path',
      permanent: true,
    },
    // 旧・紹介サイト（静的HTML）のURLをトップへ
    { source: '/index.html', destination: '/', permanent: true },
    { source: '/index_en.html', destination: '/', permanent: true },
    { source: '/join', destination: '/auth/login', permanent: false },
    { source: '/login', destination: '/auth/login', permanent: false },
    { source: '/signup', destination: '/auth/login', permanent: false },
  ],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://maps.googleapis.com https://maps.gstatic.com https://*.googleusercontent.com https://*.ggpht.com https://masuo444.github.io https://assets.st-note.com; frame-src https://js.stripe.com https://maps.googleapis.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://maps.googleapis.com; worker-src 'self'; manifest-src 'self'" },
      ],
    },
  ],
};

export default withSerwist(nextConfig);
