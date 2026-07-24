import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { newsService } from '@/services/newsService'
import { Database } from '@/types/database.types'

type NewsPost = Database['public']['Tables']['news_posts']['Row']
type NewsCategory = Database['public']['Enums']['news_category']

const SEARCH_DEBOUNCE_MS = 350

interface UseNewsReturn {
  news: NewsPost[]
  filteredNews: NewsPost[]
  selectedCategory: NewsCategory | 'ALL'
  searchQuery: string
  isLoading: boolean
  isOffline: boolean
  error: string | null
  setSelectedCategory: (category: NewsCategory | 'ALL') => void
  setSearchQuery: (query: string) => void
  reload: () => Promise<void>
}

/**
 * Hook de notícias:
 * - Busca única + filtro categoria em memória
 * - Busca textual debounced (350ms) via Supabase ilike
 * - Fallback para cache AsyncStorage quando offline
 */
export function useNews(): UseNewsReturn {
  const [news, setNews] = useState<NewsPost[]>([])
  const [searchResults, setSearchResults] = useState<NewsPost[] | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<
    NewsCategory | 'ALL'
  >('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setIsOffline(false)

      const data = await newsService.getAllNews(50)
      setNews(data)
    } catch (err) {
      console.error('Error loading news, trying cache:', err)

      const cached = await newsService.getCachedNews()
      if (cached && cached.length > 0) {
        setNews(cached)
        setIsOffline(true)
      } else {
        setError('Erro ao carregar notícias')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Busca textual debounced
   */
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    const trimmed = searchQuery.trim()

    if (!trimmed) {
      setSearchResults(null)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await newsService.searchNews(trimmed, 50)
        setSearchResults(results)
      } catch (err) {
        console.error('Error searching news:', err)
        setSearchResults([])
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery])

  /**
   * Resultado final: busca ativa tem precedência; senão, filtro por categoria
   */
  const filteredNews = useMemo(() => {
    const source = searchResults ?? news

    if (selectedCategory === 'ALL') return source
    return source.filter((item) => item.category === selectedCategory)
  }, [news, searchResults, selectedCategory])

  return {
    news,
    filteredNews,
    selectedCategory,
    searchQuery,
    isLoading,
    isOffline,
    error,
    setSelectedCategory,
    setSearchQuery,
    reload: load,
  }
}
