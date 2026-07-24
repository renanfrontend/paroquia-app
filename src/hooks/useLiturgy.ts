import { useCallback, useEffect, useState } from 'react'
import { addDays, subDays } from 'date-fns'
import { liturgyService } from '@/services/liturgyService'
import { Database } from '@/types/database.types'

type DailyLiturgy = Database['public']['Tables']['daily_liturgy']['Row']

interface UseLiturgyReturn {
  liturgy: DailyLiturgy | null
  selectedDate: Date
  isLoading: boolean
  error: string | null
  goToPreviousDay: () => void
  goToNextDay: () => void
  goToToday: () => void
  reload: () => Promise<void>
}

/**
 * Hook de liturgia diária:
 * - Busca com fallback para cache offline (via liturgyService)
 * - Navegação de datas encapsulada
 * - Pre-cache dos próximos 7 dias no mount
 */
export function useLiturgy(initialDate: Date = new Date()): UseLiturgyReturn {
  const [liturgy, setLiturgy] = useState<DailyLiturgy | null>(null)
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (date: Date) => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await liturgyService.getLiturgyOfDay(date)

      if (data) {
        setLiturgy(data)
      } else {
        setLiturgy(null)
        setError('Liturgia não disponível para este dia')
      }
    } catch (err) {
      console.error('Error loading liturgy:', err)
      setLiturgy(null)
      setError('Erro ao carregar a liturgia')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Pre-cache em background, sem bloquear a UI
    liturgyService.preCacheLiturgy(7)
  }, [])

  useEffect(() => {
    load(selectedDate)
  }, [selectedDate, load])

  return {
    liturgy,
    selectedDate,
    isLoading,
    error,
    goToPreviousDay: () => setSelectedDate((d) => subDays(d, 1)),
    goToNextDay: () => setSelectedDate((d) => addDays(d, 1)),
    goToToday: () => setSelectedDate(new Date()),
    reload: () => load(selectedDate),
  }
}
