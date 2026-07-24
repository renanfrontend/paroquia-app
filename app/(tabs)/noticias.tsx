import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { NewsCard } from '@/components/NewsCard'
import { newsService } from '@/services/newsService'
import { Database } from '@/types/database.types'
import { Search, AlertCircle } from 'lucide-react-native'

type NewsPost = Database['public']['Tables']['news_posts']['Row']
type NewsCategory = Database['public']['Enums']['news_category']

const CATEGORY_OPTIONS: NewsCategory[] = [
  'AVISO',
  'EVENTO',
  'PASTORAL',
  'FESTA',
  'CATEQUESE',
]

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  AVISO: '📌 Aviso',
  EVENTO: '🎉 Evento',
  PASTORAL: '🙏 Pastoral',
  FESTA: '✨ Festa',
  CATEQUESE: '📚 Catequese',
}

export default function NoticiasScreen() {
  const [news, setNews] = useState<NewsPost[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'ALL'>(
    'ALL',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carregar notícias
   */
  const loadNews = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await newsService.getAllNews(50)
      setNews(data)
    } catch (err) {
      console.error('Error loading news:', err)
      setError('Erro ao carregar notícias. Tente novamente.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  /**
   * Executar busca
   */
  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.trim()) {
      try {
        const results = await newsService.searchNews(query, 50)
        setFilteredNews(results)
      } catch (err) {
        console.error('Error searching news:', err)
        setFilteredNews([])
      }
    } else {
      applyFilters(news, selectedCategory)
    }
  }

  /**
   * Aplicar filtros
   */
  const applyFilters = (
    newsArray: NewsPost[],
    category: NewsCategory | 'ALL',
  ) => {
    let filtered = newsArray

    if (category !== 'ALL') {
      filtered = filtered.filter((item) => item.category === category)
    }

    setFilteredNews(filtered)
  }

  /**
   * Ao mudar categoria
   */
  const handleCategoryChange = (category: NewsCategory | 'ALL') => {
    setSelectedCategory(category)
    setSearchQuery('')
    applyFilters(news, category)
  }

  useEffect(() => {
    loadNews()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      if (news.length > 0) {
        applyFilters(news, selectedCategory)
      }
    }, [news, selectedCategory]),
  )

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setIsRefreshing(true)
            loadNews()
          }}
          tintColor="#dc2626"
        />
      }
    >
      <View className="p-4">
        {/* Barra de busca */}
        <View className="mb-4 flex-row items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
          <Search size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="Buscar notícias..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {/* Mensagem de erro */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row items-center gap-2">
            <AlertCircle size={20} color="#dc2626" />
            <Text className="text-red-700 text-sm flex-1">{error}</Text>
          </View>
        )}

        {/* Filtro por categoria */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-gray-600 mb-2 uppercase">
            Categoria
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="gap-2"
          >
            <TouchableOpacity
              onPress={() => handleCategoryChange('ALL')}
              className={`px-3 py-2 rounded-lg ${
                selectedCategory === 'ALL'
                  ? 'bg-red-600'
                  : 'bg-white border border-gray-300'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === 'ALL'
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                Todas
              </Text>
            </TouchableOpacity>

            {CATEGORY_OPTIONS.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryChange(category)}
                className={`px-3 py-2 rounded-lg ${
                  selectedCategory === category
                    ? 'bg-red-600'
                    : 'bg-white border border-gray-300'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lista de notícias */}
        {filteredNews.length > 0 ? (
          <>
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              {filteredNews.length} notícia(s) encontrada(s)
            </Text>
            {filteredNews.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))}
          </>
        ) : (
          <View className="py-12 items-center">
            <Text className="text-gray-600 font-medium mb-2">
              Nenhuma notícia encontrada
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              {searchQuery
                ? 'Tente ajustar sua busca'
                : 'Não há notícias para esta categoria'}
            </Text>
          </View>
        )}

        {/* Espaçador */}
        <View className="h-8" />
      </View>
    </ScrollView>
  )
}
