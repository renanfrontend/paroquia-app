import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useRouter } from 'expo-router'
import { PrayerItem } from '@/components/PrayerItem'
import { prayerService } from '@/services/prayerService'
import { Database } from '@/types/database.types'
import { Plus, TrendingUp, AlertCircle } from 'lucide-react-native'

type PrayerRequest = Database['public']['Tables']['prayer_requests']['Row']
type PrayerCategory = Database['public']['Enums']['prayer_category']

const CATEGORY_OPTIONS: PrayerCategory[] = [
  'SAUDE',
  'FAMILIA',
  'AGRADECIMENTO',
  'FALECIMENTO',
  'INTENCAO_GERAL',
]

const CATEGORY_LABELS: Record<PrayerCategory, string> = {
  SAUDE: '🏥 Saúde',
  FAMILIA: '👨‍👩‍👧‍👦 Família',
  AGRADECIMENTO: '🙏 Agradecimento',
  FALECIMENTO: '⚰️ Falecimento',
  INTENCAO_GERAL: '✨ Intenção Geral',
}

export default function OracoesScreen() {
  const router = useRouter()
  const [prayers, setPrayers] = useState<PrayerRequest[]>([])
  const [filteredPrayers, setFilteredPrayers] = useState<PrayerRequest[]>([])
  const [selectedCategory, setSelectedCategory] = useState<
    PrayerCategory | 'TRENDING' | 'ALL'
  >('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carregar orações
   */
  const loadPrayers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await prayerService.getPublicPrayers(50)
      setPrayers(data)
      setFilteredPrayers(data)
    } catch (err) {
      console.error('Error loading prayers:', err)
      setError('Erro ao carregar orações. Tente novamente.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  /**
   * Filtrar por categoria
   */
  const handleCategoryChange = async (
    category: PrayerCategory | 'TRENDING' | 'ALL',
  ) => {
    setSelectedCategory(category)
    setIsLoading(true)

    try {
      let data: PrayerRequest[]

      if (category === 'TRENDING') {
        data = await prayerService.getTrendingPrayers(50)
      } else if (category === 'ALL') {
        data = await prayerService.getPublicPrayers(50)
      } else {
        data = await prayerService.getPrayersByCategory(category, 50)
      }

      setFilteredPrayers(data)
    } catch (err) {
      console.error('Error filtering prayers:', err)
      setError('Erro ao filtrar orações')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPrayers()

    // Subscribe em tempo real a novas orações
    const unsubscribe = prayerService.subscribeToNewPrayers(
      (newPrayer) => {
        setPrayers((prev) => [newPrayer, ...prev])
        if (selectedCategory === 'ALL') {
          setFilteredPrayers((prev) => [newPrayer, ...prev])
        }
      },
      (error) => {
        console.error('Subscription error:', error)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadPrayers()
    }, []),
  )

  if (isLoading && prayers.length === 0) {
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
            loadPrayers()
          }}
          tintColor="#dc2626"
        />
      }
    >
      <View className="p-4">
        {/* Botão Novo Pedido */}
        <TouchableOpacity
          onPress={() => router.push('/modals/novo-pedido-oracao')}
          className="mb-4 px-4 py-3 bg-red-600 rounded-lg flex-row items-center justify-center gap-2 active:bg-red-700"
        >
          <Plus size={20} color="white" />
          <Text className="text-white font-bold">Novo Pedido de Oração</Text>
        </TouchableOpacity>

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
              onPress={() => handleCategoryChange('TRENDING')}
              className={`px-3 py-2 rounded-lg flex-row items-center gap-1 ${
                selectedCategory === 'TRENDING'
                  ? 'bg-red-600'
                  : 'bg-white border border-gray-300'
              }`}
            >
              <TrendingUp
                size={14}
                color={selectedCategory === 'TRENDING' ? 'white' : '#6b7280'}
              />
              <Text
                className={`text-xs font-semibold ${
                  selectedCategory === 'TRENDING'
                    ? 'text-white'
                    : 'text-gray-700'
                }`}
              >
                Trending
              </Text>
            </TouchableOpacity>

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

        {/* Lista de orações */}
        {filteredPrayers.length > 0 ? (
          <>
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              {filteredPrayers.length} intenção(ões)
            </Text>
            {filteredPrayers.map((prayer) => (
              <PrayerItem
                key={prayer.id}
                prayer={prayer}
                onUpdate={() => loadPrayers()}
              />
            ))}
          </>
        ) : (
          <View className="py-12 items-center">
            <Text className="text-gray-600 font-medium mb-2">
              Nenhuma oração encontrada
            </Text>
            <Text className="text-gray-500 text-sm text-center mb-4">
              Seja o primeiro a compartilhar uma intenção de oração
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/modals/novo-pedido-oracao')}
              className="px-6 py-2 bg-red-600 rounded-lg active:bg-red-700"
            >
              <Text className="text-white font-semibold">
                Enviar Intenção
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Espaçador */}
        <View className="h-8" />
      </View>
    </ScrollView>
  )
}
