export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string
          user_id: string
          title: string
          icon: string
          parent_id: string | null
          position: number
          due_date: string | null
          status: 'todo' | 'in-progress' | 'done' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          icon?: string
          parent_id?: string | null
          position?: number
          due_date?: string | null
          status?: 'todo' | 'in-progress' | 'done' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          icon?: string
          parent_id?: string | null
          position?: number
          due_date?: string | null
          status?: 'todo' | 'in-progress' | 'done' | null
          created_at?: string
          updated_at?: string
        }
      }
      blocks: {
        Row: {
          id: string
          page_id: string
          type: string
          content: Json
          position: number
          checked: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          type: string
          content: Json
          position?: number
          checked?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          type?: string
          content?: Json
          position?: number
          checked?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: string | null
          start_date: string
          end_date: string | null
          all_day: boolean
          status: 'scheduled' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high'
          linked_page_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon?: string | null
          start_date: string
          end_date?: string | null
          all_day?: boolean
          status?: 'scheduled' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          linked_page_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: string | null
          start_date?: string
          end_date?: string | null
          all_day?: boolean
          status?: 'scheduled' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high'
          linked_page_id?: string | null
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
