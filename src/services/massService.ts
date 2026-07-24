import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type MassSchedule = Database['public']['Tables']['mass_schedules']['Row']

/**
 * Mapear número do dia da semana (JS) para enum do database
 * JS: 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
 */
const DAY_OF_WEEK_MAP = [
  'DOMINGO',
  'SEGUNDA',
  'TERCA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SABADO',
] as const

export const massService = {
  /**
   * Buscar todos os horários de missas ativas ordenados por dia da semana
   */
  async getAllMasses(): Promise<MassSchedule[]> {
    const { data, error } = await supabase
      .from('mass_schedules')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('time', { ascending: true })

    if (error) {
      console.error('Error fetching masses:', error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar missas de um dia específico
   */
  async getMassesByDay(
    dayOfWeek: (typeof DAY_OF_WEEK_MAP)[number],
  ): Promise<MassSchedule[]> {
    const { data, error } = await supabase
      .from('mass_schedules')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .order('time', { ascending: true })

    if (error) {
      console.error(`Error fetching masses for ${dayOfWeek}:`, error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar próxima missa (hoje ou dias seguintes)
   */
  async getUpcomingMass(): Promise<MassSchedule | null> {
    const now = new Date()
    const today = now.getDay() // 0 = domingo
    const currentTime = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    // Buscar primeiro todas as missas de hoje que são posteriores à hora atual
    const todayDay = DAY_OF_WEEK_MAP[today]
    const { data: todayMasses, error: todayError } = await supabase
      .from('mass_schedules')
      .select('*')
      .eq('day_of_week', todayDay)
      .eq('is_active', true)
      .gt('time', currentTime)
      .order('time', { ascending: true })
      .limit(1)

    if (todayError) {
      console.error('Error fetching today masses:', todayError)
      throw todayError
    }

    if (todayMasses && todayMasses.length > 0) {
      return todayMasses[0]
    }

    // Se não houver missa hoje, buscar próximo dia com missas
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(now)
      nextDate.setDate(nextDate.getDate() + i)
      const nextDay = nextDate.getDay()
      const nextDayName = DAY_OF_WEEK_MAP[nextDay]

      const { data: nextMasses, error: nextError } = await supabase
        .from('mass_schedules')
        .select('*')
        .eq('day_of_week', nextDayName)
        .eq('is_active', true)
        .order('time', { ascending: true })
        .limit(1)

      if (nextError) {
        console.error(`Error fetching masses for ${nextDayName}:`, nextError)
        continue
      }

      if (nextMasses && nextMasses.length > 0) {
        return nextMasses[0]
      }
    }

    return null
  },

  /**
   * Buscar missas por tipo (MISSA, CONFISSAO, etc)
   */
  async getMassesByType(
    type: Database['public']['Enums']['mass_type'],
  ): Promise<MassSchedule[]> {
    const { data, error } = await supabase
      .from('mass_schedules')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('time', { ascending: true })

    if (error) {
      console.error(`Error fetching ${type} schedules:`, error)
      throw error
    }

    return data || []
  },

  /**
   * Buscar missas por localização
   */
  async getMassesByLocation(location: string): Promise<MassSchedule[]> {
    const { data, error } = await supabase
      .from('mass_schedules')
      .select('*')
      .eq('location', location)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('time', { ascending: true })

    if (error) {
      console.error(`Error fetching masses at ${location}:`, error)
      throw error
    }

    return data || []
  },

  /**
   * Agrupar missas por dia da semana
   */
  async getMassesGroupedByDay(): Promise<
    Record<string, MassSchedule[]>
  > {
    const masses = await this.getAllMasses()

    return masses.reduce(
      (acc, mass) => {
        if (!acc[mass.day_of_week]) {
          acc[mass.day_of_week] = []
        }
        acc[mass.day_of_week].push(mass)
        return acc
      },
      {} as Record<string, MassSchedule[]>,
    )
  },
}
