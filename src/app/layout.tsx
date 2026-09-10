import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guild-app.fomusglobal.com'

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'FOMUS GUILD | 枡から始まる、世界のつながり — Global MASU Community',
    template: '%s | FOMUS GUILD',
  },
  description: '枡ブランドFOMUSの公式オンラインコミュニティ「FOMUS GUILD」。世界中の枡コミュニティが集まり、代表まっすーの活動記と学びをほぼ毎日更新。無料で参加できます。FOMUS GUILD is the online community of the Masu brand FOMUS, with daily notes from founder MaSU in Fuefuki, Yamanashi.',
  keywords: ['FOMUS', 'FOMUS GUILD', 'GUILD', 'MASU', '枡', 'まっすー', 'community', 'creators', 'Japanese culture', 'global', '笛吹市'],
  alternates: {
    canonical: '/',
    languages: { ja: '/', en: '/' },
  },
  robots: { index: true, follow: true },
  authors: [{ name: 'FOMUS Global' }],
  creator: 'FOMUS Global',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'ja_JP',
    url: APP_URL,
    siteName: 'FOMUS GUILD',
    title: 'FOMUS GUILD — Global MASU Community',
    description: 'FOMUS GUILD is the online community of the Masu brand FOMUS, where Masu communities around the world come together. Members-only salon posts from founder MaSU, now based in Fuefuki, Yamanashi, updated almost daily.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FOMUS GUILD — Global MASU Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FOMUS GUILD — Global MASU Community',
    description: 'FOMUS GUILD is the online community of the Masu brand FOMUS, where Masu communities around the world come together. Members-only salon posts from founder MaSU, now based in Fuefuki, Yamanashi, updated almost daily.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FOMUS GUILD',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  )
}
