import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configError = (!url || !anonKey)
  ? 'Supabase connection is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  : null

export const supabase = configError ? null : createClient(url, anonKey)
