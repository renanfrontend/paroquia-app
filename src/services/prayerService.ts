import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type PrayerRequest = Database['public']['Tables']['prayer_requests']['Row']
type PrayerInsert = Database['public']['Tables']['prayer_requests']['Insert']

export const prayerService = {
  /**
   * Buscar orações públicas aprovadas (mais recentes)
   */
  async getPublicPrayers(limit: number = 20): Promise<PrayerRequest[]> {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('is_private', false)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching public prayers:', error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar orações por categoria
   */
  async getPrayersByCategory(
    category: Database['public']['Enums']['prayer_category'],
    limit: number = 20,
  ): Promise<PrayerRequest[]> {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('category', category)
      .eq('is_private', false)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error(`Error fetching prayers by category ${category}:`, error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar orações do usuário autenticado (públicas e privadas)
   */
  async getMyPrayers(): Promise<PrayerRequest[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching my prayers:', error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar orações com mais rezas (trending)
   */
  async getTrendingPrayers(limit: number = 10): Promise<PrayerRequest[]> {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('is_private', false)
      .eq('is_approved', true)
      .order('prayers_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching trending prayers:', error)
      throw error
    }

    return data || []
  },

  /**
   * Criar novo pedido de oração
   */
  async createPrayerRequest(
    payload: Omit<PrayerInsert, 'id' | 'created_at'>,
  ): Promise<PrayerRequest> {
    const { data, error } = await supabase
      .from('prayer_requests')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Error creating prayer request:', error)
      throw error
    }

    return data
  },

  /**
   * Incrementar contador de "Rezei por você"
   */
  async recordPrayerSupport(prayerId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Registrar intercessão
    const { error: insertError } = await supabase
      .from('prayer_supports')
      .insert({
        prayer_id: prayerId,
        user_id: user?.id || null,
      })

    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('Error recording prayer support:', insertError)
      throw insertError
    }

    // Incrementar contador
    const { data: prayer, error: selectError } = await supabase
      .from('prayer_requests')
      .select('prayers_count')
      .eq('id', prayerId)
      .single()

    if (selectError) {
      console.error('Error fetching prayer count:', selectError)
      throw selectError
    }

    const { error: updateError } = await supabase
      .from('prayer_requests')
      .update({
        prayers_count: (prayer.prayers_count || 0) + 1,
      })
      .eq('id', prayerId)

    if (updateError) {
      console.error('Error updating prayer count:', updateError)
      throw updateError
    }
  },

  /**
   * Acender vela virtual (incrementar contador de velas)
   */
  async lightCandle(prayerId: string): Promise<void> {
    const { data: prayer, error: selectError } = await supabase
      .from('prayer_requests')
      .select('candles_lit')
      .eq('id', prayerId)
      .single()

    if (selectError) {
      console.error('Error fetching candle count:', selectError)
      throw selectError
    }

    const { error: updateError } = await supabase
      .from('prayer_requests')
      .update({
        candles_lit: (prayer.candles_lit || 0) + 1,
      })
      .eq('id', prayerId)

    if (updateError) {
      console.error('Error lighting candle:', updateError)
      throw updateError
    }
  },

  /**
   * Subscribe em tempo real a novas orações públicas
   */
  subscribeToNewPrayers(
    onInsert: (prayer: PrayerRequest) => void,
    onError?: (error: unknown) => void,
  ) {
    const channel = supabase
      .channel('new_prayers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'prayer_requests',
          filter: 'is_private=eq.false AND is_approved=eq.true',
        },
        (payload) => {
          if (payload.new) {
            onInsert(payload.new as PrayerRequest)
          }
        },
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError?.(error ?? new Error(status))
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Subscribe em mudanças de contadores (rezas e velas)
   */
  subscribeToCounterUpdates(
    prayerId: string,
    onUpdate: (prayer: PrayerRequest) => void,
    onError?: (error: unknown) => void,
  ) {
    const channel = supabase
      .channel(`prayer_${prayerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prayer_requests',
          filter: `id=eq.${prayerId}`,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as PrayerRequest)
          }
        },
      )
      .subscribe((status, error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          onError?.(error ?? new Error(status))
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },
}
