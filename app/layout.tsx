import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL

export const metadata: Metadata = {
  metadataBase: siteUrl
    ? new URL(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`)
    : undefined,
  title: 'Fife Family Picks',
  description: 'Simple Fife places and live local event ideas in one view.',
  openGraph: {
    title: 'Fife Family Picks',
    description: 'Simple Fife places and live local event ideas in one view.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fife Family Picks',
    description: 'Simple Fife places and live local event ideas in one view.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
