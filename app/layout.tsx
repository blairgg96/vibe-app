import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Fife Family Fun',
  description: 'Simple Fife places and live local event ideas in one view.',
  openGraph: {
    title: 'Fife Family Fun',
    description: 'Simple Fife places and live local event ideas in one view.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fife Family Fun',
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
