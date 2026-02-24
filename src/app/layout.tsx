import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/providers/session-provider'
import { ToastProvider } from '@/providers/toast-provider'

const fontSans = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NelaGlow - Sistema de Gestion',
  description: 'Sistema de gestion de ventas y envios para NelaGlow',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  )
}
