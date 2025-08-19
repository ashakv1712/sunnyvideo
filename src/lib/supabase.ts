import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  username: string
  created_at: string
}

export interface VideoMessage {
  id: string
  sender_id: string
  recipient_id: string
  video_url: string
  created_at: string
  expires_at: string
  viewed: boolean
  viewed_at?: string
}

export interface Contact {
  id: string
  user_id: string
  contact_user_id: string
  contact_username: string
  created_at: string
}