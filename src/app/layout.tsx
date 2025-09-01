import type { Metadata } from 'next'
import { Inter, Noto_Sans_Devanagari } from 'next/font/google'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from '@/lib/auth'
import { QueryProvider } from '@/lib/query'
import { LanguageProvider } from '@/lib/language'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoSansDevanagari = Noto_Sans_Devanagari({ 
  subsets: ['devanagari'], 
  variable: '--font-devanagari' 
})

export const metadata: Metadata = {
  title: 'पथ विक्रेता एकता संघ मध्यप्रदेश | Path Vikreta Ekta Sangh Madhya Pradesh',
  description: 'पथ विक्रेताओं के लिए एकता और विकास का मंच | Platform for unity and development of street vendors',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hi">
      <body className={`${inter.variable} ${notoSansDevanagari.variable} font-sans`}>
        <LanguageProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </AuthProvider>
          </QueryProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}