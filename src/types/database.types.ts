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
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          community_name: string
          role: 'MEMBER' | 'PASTORAL_LEADER' | 'ADMIN_PARISH'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email?: string | null
          phone?: string | null
          community_name?: string
          role?: 'MEMBER' | 'PASTORAL_LEADER' | 'ADMIN_PARISH'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          community_name?: string
          role?: 'MEMBER' | 'PASTORAL_LEADER' | 'ADMIN_PARISH'
          created_at?: string
          updated_at?: string
        }
      }
      mass_schedules: {
        Row: {
          id: string
          day_of_week: 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'
          time: string
          location: string
          type: 'MISSA' | 'CONFISSAO' | 'ADORACAO' | 'TERCO' | 'NOVENA'
          description: string | null
          celebrant: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          day_of_week: 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'
          time: string
          location?: string
          type?: 'MISSA' | 'CONFISSAO' | 'ADORACAO' | 'TERCO' | 'NOVENA'
          description?: string | null
          celebrant?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          day_of_week?: 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'
          time?: string
          location?: string
          type?: 'MISSA' | 'CONFISSAO' | 'ADORACAO' | 'TERCO' | 'NOVENA'
          description?: string | null
          celebrant?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_liturgy: {
        Row: {
          id: string
          date: string
          liturgical_color: 'VERDE' | 'VERMELHO' | 'ROXO' | 'BRANCO' | 'ROSA'
          title: string
          first_reading_ref: string | null
          first_reading_text: string | null
          psalm_ref: string | null
          psalm_refrain: string | null
          psalm_text: string | null
          second_reading_ref: string | null
          second_reading_text: string | null
          gospel_ref: string
          gospel_text: string
          reflection: string | null
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          liturgical_color?: 'VERDE' | 'VERMELHO' | 'ROXO' | 'BRANCO' | 'ROSA'
          title: string
          first_reading_ref?: string | null
          first_reading_text?: string | null
          psalm_ref?: string | null
          psalm_refrain?: string | null
          psalm_text?: string | null
          second_reading_ref?: string | null
          second_reading_text?: string | null
          gospel_ref: string
          gospel_text: string
          reflection?: string | null
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          liturgical_color?: 'VERDE' | 'VERMELHO' | 'ROXO' | 'BRANCO' | 'ROSA'
          title?: string
          first_reading_ref?: string | null
          first_reading_text?: string | null
          psalm_ref?: string | null
          psalm_refrain?: string | null
          psalm_text?: string | null
          second_reading_ref?: string | null
          second_reading_text?: string | null
          gospel_ref?: string
          gospel_text?: string
          reflection?: string | null
          audio_url?: string | null
          created_at?: string
        }
      }
      news_posts: {
        Row: {
          id: string
          title: string
          summary: string
          content: string
          category: 'AVISO' | 'EVENTO' | 'PASTORAL' | 'FESTA' | 'CATEQUESE'
          image_url: string | null
          is_pinned: boolean
          published_at: string
          author_id: string | null
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary: string
          content: string
          category?: 'AVISO' | 'EVENTO' | 'PASTORAL' | 'FESTA' | 'CATEQUESE'
          image_url?: string | null
          is_pinned?: boolean
          published_at?: string
          author_id?: string | null
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string
          content?: string
          category?: 'AVISO' | 'EVENTO' | 'PASTORAL' | 'FESTA' | 'CATEQUESE'
          image_url?: string | null
          is_pinned?: boolean
          published_at?: string
          author_id?: string | null
          likes_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      prayer_requests: {
        Row: {
          id: string
          user_id: string | null
          author_name: string
          intention: string
          category: 'SAUDE' | 'FAMILIA' | 'AGRADECIMENTO' | 'FALECIMENTO' | 'INTENCAO_GERAL'
          is_private: boolean
          is_approved: boolean
          prayers_count: number
          candles_lit: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          author_name: string
          intention: string
          category?: 'SAUDE' | 'FAMILIA' | 'AGRADECIMENTO' | 'FALECIMENTO' | 'INTENCAO_GERAL'
          is_private?: boolean
          is_approved?: boolean
          prayers_count?: number
          candles_lit?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          author_name?: string
          intention?: string
          category?: 'SAUDE' | 'FAMILIA' | 'AGRADECIMENTO' | 'FALECIMENTO' | 'INTENCAO_GERAL'
          is_private?: boolean
          is_approved?: boolean
          prayers_count?: number
          candles_lit?: number
          created_at?: string
        }
      }
      prayer_supports: {
        Row: {
          id: string
          prayer_id: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          prayer_id: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          prayer_id?: string
          user_id?: string | null
          created_at?: string
        }
      }
      tithe_info: {
        Row: {
          id: string
          parish_name: string
          cnpj: string
          pix_key: string
          pix_key_type: string
          city: string
          bank_name: string | null
          account_info: string | null
          custom_message: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parish_name?: string
          cnpj: string
          pix_key: string
          pix_key_type?: string
          city?: string
          bank_name?: string | null
          account_info?: string | null
          custom_message?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parish_name?: string
          cnpj?: string
          pix_key?: string
          pix_key_type?: string
          city?: string
          bank_name?: string | null
          account_info?: string | null
          custom_message?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<never, never>
    Functions: {
      increment_prayer_support: {
        Args: { p_prayer_id: string }
        Returns: number
      }
      light_candle: {
        Args: { p_prayer_id: string }
        Returns: number
      }
      like_news: {
        Args: { p_news_id: string }
        Returns: number
      }
      has_parish_role: {
        Args: { roles: Database['public']['Enums']['user_role'][] }
        Returns: boolean
      }
      is_parish_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      day_of_week: 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO'
      liturgy_color: 'VERDE' | 'VERMELHO' | 'ROXO' | 'BRANCO' | 'ROSA'
      mass_type: 'MISSA' | 'CONFISSAO' | 'ADORACAO' | 'TERCO' | 'NOVENA'
      news_category: 'AVISO' | 'EVENTO' | 'PASTORAL' | 'FESTA' | 'CATEQUESE'
      prayer_category: 'SAUDE' | 'FAMILIA' | 'AGRADECIMENTO' | 'FALECIMENTO' | 'INTENCAO_GERAL'
      user_role: 'MEMBER' | 'PASTORAL_LEADER' | 'ADMIN_PARISH'
    }
  }
}
