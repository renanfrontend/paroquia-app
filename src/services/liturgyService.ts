import { supabase, cacheManager } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { format } from 'date-fns'

type DailyLiturgy = Database['public']['Tables']['daily_liturgy']['Row']

export const liturgyService = {
  /**
   * Buscar liturgia do dia (com fallback para cache offline)
   */
  async getLiturgyOfDay(date: Date = new Date()): Promise<DailyLiturgy | null> {
    const dateStr = format(date, 'yyyy-MM-dd')

    try {
      // Tentar buscar do Supabase
      const { data, error } = await supabase
        .from('daily_liturgy')
        .select('*')
        .eq('date', dateStr)
        .single()

      if (!error && data) {
        // Cache bem-sucedido
        await cacheManager.cacheLiturgy(dateStr, data)
        return data
      }

      // Se houver erro de conexão, tentar cache offline
      const cached = await cacheManager.getCachedLiturgy(dateStr)
      if (cached) {
        console.log(`Using cached liturgy for ${dateStr}`)
        return cached
      }

      if (error) {
        console.error('Error fetching liturgy:', error)
        throw error
      }

      return null
    } catch (error) {
      // Fallback: tentar cache offline
      const cached = await cacheManager.getCachedLiturgy(dateStr)
      if (cached) {
        console.log(`Using cached liturgy for ${dateStr}`)
        return cached
      }

      console.error('Error fetching liturgy:', error)
      return null
    }
  },

  /**
   * Buscar liturgia de um intervalo de datas
   */
  async getLiturgyRange(
    startDate: Date,
    endDate: Date,
  ): Promise<DailyLiturgy[]> {
    const start = format(startDate, 'yyyy-MM-dd')
    const end = format(endDate, 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('daily_liturgy')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching liturgy range:', error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar por cor litúrgica
   */
  async getLiturgyByColor(
    color: Database['public']['Enums']['liturgy_color'],
  ): Promise<DailyLiturgy[]> {
    const { data, error } = await supabase
      .from('daily_liturgy')
      .select('*')
      .eq('liturgical_color', color)
      .order('date', { ascending: false })

    if (error) {
      console.error(`Error fetching liturgy with color ${color}:`, error)
      throw error
    }

    return data || []
  },

  /**
   * Stream de atualizações em tempo real da liturgia do dia
   */
  subscribeToLiturgyUpdates(
    date: Date,
    onUpdate: (liturgy: DailyLiturgy) => void,
    onError?: (error: any) => void,
  ) {
    const dateStr = format(date, 'yyyy-MM-dd')

    const channel = supabase
      .channel(`liturgy_${dateStr}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_liturgy',
          filter: `date=eq.${dateStr}`,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as DailyLiturgy)
            // Atualizar cache
            cacheManager.cacheLiturgy(dateStr, payload.new as DailyLiturgy)
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
   * Pré-cachear liturgia para os próximos dias
   */
  async preCacheLiturgy(days: number = 7) {
    const today = new Date()
    const startDate = today
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + days)

    try {
      const liturgies = await this.getLiturgyRange(startDate, endDate)

      for (const liturgy of liturgies) {
        await cacheManager.cacheLiturgy(liturgy.date, liturgy)
      }

      console.log(`Pre-cached ${liturgies.length} liturgies`)
      return liturgies.length
    } catch (error) {
      console.error('Error pre-caching liturgies:', error)
      return 0
    }
  },
}
