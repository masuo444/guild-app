import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  turbopack: {},
  typescript: {
    // resend@6.9.0 の .d.mts に型エラーあり（react: void 0）
    // skipLibCheck: true でも Next.js ビルドで検出されるため無視
    ignoreBuildErrors: true,
  },
};

export default withSerwist(nextConfig);
