import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'Impact Board - Eden Care',
  description: 'Performance review accomplishment tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-[240px] min-h-screen flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
