import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => {
  return createClientComponentClient()
}

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string
          title: string
          content: string
          created_at: string
          updated_at: string
          user_id: string
          is_public: boolean
          share_token: string | null
        }
        Insert: {
          id?: string
          title: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id: string
          is_public?: boolean
          share_token?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          is_public?: boolean
          share_token?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
