import { useCallback, useEffect, useRef, useState } from 'react'
import { prayerService } from '@/services/prayerService'
import { Database } from '@/types/database.types'

type PrayerRequest = Database['public']['Tables']['prayer_requests']['Row']
type PrayerCategory = Database['public']['Enums']['prayer_category']
export type PrayerFilter = PrayerCategory | 'TRENDING' | 'ALL'

interface UsePrayersReturn {
  prayers: PrayerRequest[]
  filter: PrayerFilter
  isLoading: boolean
  error: string | null
  setFilter: (filter: PrayerFilter) => void
  reload: () => Promise<void>
}

/**
 * Hook de pedidos de oração:
 * - Busca por filtro (todas / trending / categoria)
 * - Listener real-time para novas orações públicas
 * - Cleanup automático da subscription no unmount
 */
export function usePrayers(initialFilter: PrayerFilter = 'ALL'): UsePrayersReturn {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([])
  const [filter, setFilter] = useState<PrayerFilter>(initialFilter)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Ref para o filtro atual — evita stale closure no callback do real-time
   */
  const filterRef = useRef(filter)
  filterRef.current = filter

  const load = useCallback(async (activeFilter: PrayerFilter) => {
    try {
      setIsLoading(true)
      setError(null)

      let data: PrayerRequest[]

      if (activeFilter === 'TRENDING') {
        data = await prayerService.getTrendingPrayers(50)
      } else if (activeFilter === 'ALL') {
        data = await prayerService.getPublicPrayers(50)
      } else {
        data = await prayerService.getPrayersByCategory(activeFilter, 50)
      }

      setPrayers(data)
    } catch (err) {
      console.error('Error loading prayers:', err)
      setError('Erro ao carregar orações')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load(filter)
  }, [filter, load])

  useEffect(() => {
    /**
     * Real-time: nova oração pública entra no topo da lista
     * somente se o filtro atual a incluiria
     */
    const unsubscribe = prayerService.subscribeToNewPrayers(
      (newPrayer) => {
        const currentFilter = filterRef.current
        const matchesFilter =
          currentFilter === 'ALL' || newPrayer.category === currentFilter

        if (matchesFilter) {
          setPrayers((prev) => {
            // Evitar duplicata se o próprio usuário acabou de inserir
            if (prev.some((p) => p.id === newPrayer.id)) return prev
            return [newPrayer, ...prev]
          })
        }
      },
      (err) => console.error('Prayer subscription error:', err),
    )

    return unsubscribe
  }, [])

  return {
    prayers,
    filter,
    isLoading,
    error,
    setFilter,
    reload: () => load(filter),
  }
}
