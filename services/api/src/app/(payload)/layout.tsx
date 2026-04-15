import '@payloadcms/next/css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'ژیک ادمین',
  description: 'Payload CMS Admin Panel',
}

export default function PayloadLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
