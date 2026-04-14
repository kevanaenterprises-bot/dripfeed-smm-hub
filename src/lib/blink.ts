import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'dripfeed-smm-site-l7gylq69',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_FCBm7gZ3y9IX8NmgJRAby-cs5GgVxm2G',
  auth: { mode: 'managed' },
})

// Types
export interface Service {
  id: string
  name: string
  platform: string
  service_type: string
  description: string
  icon: string
  min_quantity: number
  max_quantity: number
  price_per_unit: number
}

export interface Package {
  id: string
  service_id: string
  name: string
  quantity: number
  price: number
  drip_days: number
  is_popular: number
}

export interface Campaign {
  id: string
  user_id: string
  package_id: string
  target_url: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  total_quantity: number
  delivered_quantity: number
  drip_days: number
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  campaign_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method: string | null
  stripe_payment_id: string | null
  created_at: string
}

// Helper to convert boolean-like strings from SQLite
export function parseBool(val: string | number | null): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'boolean') return val
  return Number(val) > 0
}
