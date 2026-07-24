import { supabase, cacheManager } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type NewsPost = Database['public']['Tables']['news_posts']['Row']

export const newsService = {
  /**
   * Buscar todos os avisos/notícias (com pinned primeiro)
   */
  async getAllNews(limit: number = 50): Promise<NewsPost[]> {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching news:', error)
      throw error
    }

    // Cache local para offline
    await cacheManager.cacheNewsPosts(data || [])

    return data || []
  },

  /**
   * Buscar notícias por categoria
   */
  async getNewsByCategory(
    category: Database['public']['Enums']['news_category'],
    limit: number = 20,
  ): Promise<NewsPost[]> {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .eq('category', category)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`Error fetching news by category ${category}:`, error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar avisos pinados (destaque)
   */
  async getPinnedNews(): Promise<NewsPost[]> {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .eq('is_pinned', true)
      .order('published_at', { ascending: false })

    if (error) {
      console.error('Error fetching pinned news:', error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar um aviso específico por ID
   */
  async getNewsById(id: string): Promise<NewsPost | null> {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching news by id:', error)
      throw error
    }

    return data || null
  },

  /**
   * Buscar notícias mais "curtidas"
   */
  async getMostLikedNews(limit: number = 10): Promise<NewsPost[]> {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .order('likes_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching most liked news:', error)
      throw error
    }

    return data || []
  },

  /**
   * Pesquisar notícias por palavra-chave
   */
  async searchNews(query: string, limit: number = 20): Promise<NewsPost[]> {
    const { data, error } = await supabase
      .from('news_posts')
      .select('*')
      .or(
        `title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%`,
      )
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching news:', error)
      throw error
    }

    return data || []
  },

  /**
   * Incrementar contador de likes
   */
  async likeNews(newsId: string): Promise<number> {
    const { data: news, error: selectError } = await supabase
      .from('news_posts')
      .select('likes_count')
      .eq('id', newsId)
      .single()

    if (selectError) {
      console.error('Error fetching news likes:', selectError)
      throw selectError
    }

    const { error: updateError } = await supabase
      .from('news_posts')
      .update({
        likes_count: (news.likes_count || 0) + 1,
      })
      .eq('id', newsId)

    if (updateError) {
      console.error('Error updating likes:', updateError)
      throw updateError
    }

    return (news.likes_count || 0) + 1
  },

  /**
   * Subscribe em tempo real a novos avisos
   */
  subscribeToNewNews(
    onInsert: (news: NewsPost) => void,
    onUpdate?: (news: NewsPost) => void,
    onError?: (error: any) => void,
  ) {
    const channel = supabase
      .channel('new_news')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_posts',
        },
        (payload) => {
          if (payload.new) {
            onInsert(payload.new as NewsPost)
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'news_posts',
        },
        (payload) => {
          if (payload.new && onUpdate) {
            onUpdate(payload.new as NewsPost)
          }
        },
      )
      .on('system', { event: 'error' }, ({ message }) => {
        console.error('Supabase subscription error:', message)
        onError?.(message)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Buscar cache offline de notícias
   */
  async getCachedNews(): Promise<NewsPost[] | null> {
    return await cacheManager.getCachedNewsPosts()
  },
}
