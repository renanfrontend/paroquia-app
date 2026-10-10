import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

export type ChurchNews = Database['public']['Tables']['church_news']['Row']

export const CHURCH_NEWS_SOURCES: Record<string, string> = {
  VATICAN_NEWS: 'Vatican News',
  CNBB: 'CNBB',
}

/**
 * Manchetes da Igreja (Vatican News em português e CNBB). Quem preenche a tabela é o robô
 * scripts/update-content.mjs, de hora em hora; o app só lê e abre a matéria no site original.
 */
export const churchNewsService = {
  async getLatest(limit: number = 30): Promise<ChurchNews[]> {
    const { data, error } = await supabase
      .from('church_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching church news:', error)
      throw error
    }

    return data || []
  },

  /** Manchetes novas chegam sem recarregar a tela. Devolve a função para cancelar. */
  subscribe(onInsert: (news: ChurchNews) => void, onError?: (error: unknown) => void) {
    const channel = supabase
      .channel('church_news')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'church_news' }, (payload) => {
        if (payload.new) onInsert(payload.new as ChurchNews)
      })
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError?.(error ?? new Error(status))
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
