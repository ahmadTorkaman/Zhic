'use server'

import config from '@payload-config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'

import { importMap } from './admin/importMap.js'

/**
 * Single Server Action that Payload's admin uses to dispatch all
 * server-side calls (login, list, edit, etc).
 *
 * Lives in its own file with module-level 'use server' so Next 16's
 * directive detection registers it consistently. (Inline 'use server'
 * inside an arrow function in layout.tsx was failing to register —
 * resulting in "Failed to find Server Action 'x'" on every form submit.)
 */
export const serverFunction: ServerFunctionClient = async function (args) {
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}
