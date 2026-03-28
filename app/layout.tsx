import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { QueryProvider } from '@/app/providers'
import { AuthProvider } from '@/lib/auth-context'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#050d1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Network IDS Command Center',
  description: 'Enterprise-grade network intrusion detection and real-time monitoring system powered by ML',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <QueryProvider>
            {children}
            <Analytics />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#0a1628',
                  border: '1px solid #0f2040',
                  color: '#e2e8f0',
                  fontFamily: 'Inter, sans-serif',
                },
              }}
            />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
