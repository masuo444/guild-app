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
    default: 'FOMUS GUILD',
    template: '%s | FOMUS GUILD',
  },
  description: 'An invite-only global community connecting MASU enthusiasts, creators, and cultural collaborators worldwide.',
  keywords: ['FOMUS', 'GUILD', 'MASU', '枡', 'community', 'creators', 'Japanese culture', 'global'],
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
    description: 'An invite-only global community connecting MASU enthusiasts, creators, and cultural collaborators worldwide.',
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
    description: 'An invite-only global community connecting MASU enthusiasts, creators, and cultural collaborators worldwide.',
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  )
}
