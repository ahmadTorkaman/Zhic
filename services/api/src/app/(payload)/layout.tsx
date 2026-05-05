/**
 * Payload admin root layout.
 *
 * Wraps /admin and /api routes with Payload's RootLayout which
 * provides the ConfigContext.Provider that downstream client
 * components (the admin UI) depend on.
 *
 * The serverFunction lives in its own file with module-level 'use server'
 * because Next 16 sometimes fails to register inline arrow-function
 * server actions, causing "Failed to find Server Action 'x'" on submit.
 */
import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import '@payloadcms/next/css'
import type { ReactNode } from 'react'

import { importMap } from './admin/importMap.js'
import { serverFunction } from './serverFunction.js'

export const metadata = {
  title: 'ژیک ادمین',
  description: 'Payload CMS Admin Panel',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  )
}
