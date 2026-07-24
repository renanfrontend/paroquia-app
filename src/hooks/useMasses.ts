import { useCallback, useEffect, useMemo, useState } from 'react'
import { massService } from '@/services/massService'
import { Database } from '@/types/database.types'

type MassSchedule = Database['public']['Tables']['mass_schedules']['Row']
type DayOfWeek = Database['public']['Enums']['day_of_week']
type MassType = Database['public']['Enums']['mass_type']

interface UseMassesReturn {
  masses: MassSchedule[]
  filteredMasses: MassSchedule[]
  upcomingMass: MassSchedule | null
  selectedDay: DayOfWeek
  selectedType: MassType | 'ALL'
  isLoading: boolean
  error: string | null
  setSelectedDay: (day: DayOfWeek) => void
  setSelectedType: (type: MassType | 'ALL') => void
  reload: () => Promise<void>
}

const JS_DAY_TO_ENUM: DayOfWeek[] = [
  'DOMINGO',
  'SEGUNDA',
  'TERCA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SABADO',
]

/**
 * Hook de horários de celebrações:
 * - Busca única de todas as missas + próxima missa em paralelo
 * - Filtros dia/tipo derivados em memória (useMemo), sem re-fetch
 * - Dia inicial = dia da semana atual
 */
export function useMasses(): UseMassesReturn {
  const [masses, setMasses] = useState<MassSchedule[]>([])
  const [upcomingMass, setUpcomingMass] = useState<MassSchedule | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    JS_DAY_TO_ENUM[new Date().getDay()],
  )
  const [selectedType, setSelectedType] = useState<MassType | 'ALL'>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [allMasses, upcoming] = await Promise.all([
        massService.getAllMasses(),
        massService.getUpcomingMass(),
      ])

      setMasses(allMasses)
      setUpcomingMass(upcoming)
    } catch (err) {
      console.error('Error loading masses:', err)
      setError('Erro ao carregar horários')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Filtragem em memória — evita round-trip ao Supabase a cada toque de filtro
   */
  const filteredMasses = useMemo(
    () =>
      masses.filter((mass) => {
        const matchDay = mass.day_of_week === selectedDay
        const matchType = selectedType === 'ALL' || mass.type === selectedType
        return matchDay && matchType
      }),
    [masses, selectedDay, selectedType],
  )

  return {
    masses,
    filteredMasses,
    upcomingMass,
    selectedDay,
    selectedType,
    isLoading,
    error,
    setSelectedDay,
    setSelectedType,
    reload: load,
  }
}
