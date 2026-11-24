import { Outlet } from 'react-router-dom'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import type { ReactNode } from 'react'

export function CustomerLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="customer-layout">
      <Header />
      <main className="customer-main">{children ?? <Outlet />}</main>
      <Footer />
    </div>
  )
}
