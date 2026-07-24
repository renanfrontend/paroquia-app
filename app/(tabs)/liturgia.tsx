import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { LiturgyReader } from '@/components/LiturgyReader'
import { liturgyService } from '@/services/liturgyService'
import { Database } from '@/types/database.types'
import { ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react-native'
import { format, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type DailyLiturgy = Database['public']['Tables']['daily_liturgy']['Row']

export default function LiturgyScreen() {
  const [liturgy, setLiturgy] = useState<DailyLiturgy | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carregar liturgia do dia selecionado
   */
  const loadLiturgy = async (date: Date) => {
    try {
      setIsLoading(true)
      setError(null)
      setIsOffline(false)

      const data = await liturgyService.getLiturgyOfDay(date)

      if (data) {
        setLiturgy(data)
        // Se veio do cache, sinalizar
        const isToday =
          format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
        setIsOffline(!isToday)
      } else {
        setError('Liturgia não encontrada para este dia')
      }
    } catch (err) {
      console.error('Error loading liturgy:', err)
      setError('Erro ao carregar a liturgia. Tente novamente.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Pré-cachear próximas 7 dias
    liturgyService.preCacheLiturgy(7)
    loadLiturgy(selectedDate)
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadLiturgy(selectedDate)
    }, [selectedDate]),
  )

  /**
   * Navegação de datas
   */
  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1)
    setSelectedDate(newDate)
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header com navegação de datas */}
      <View className="bg-white border-b border-gray-200 p-4">
        {/* Data selecionada */}
        <View className="mb-4">
          <Text className="text-center text-sm text-gray-600 mb-1">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </Text>
          <Text className="text-center text-2xl font-bold text-gray-900">
            {format(selectedDate, 'dd/MM/yyyy')}
          </Text>
        </View>

        {/* Controles de navegação */}
        <View className="flex-row items-center justify-between gap-2">
          <TouchableOpacity
            onPress={handlePreviousDay}
            className="p-2 rounded-lg active:bg-gray-100"
          >
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToday}
            className="flex-1 py-2 px-3 bg-red-50 rounded-lg border border-red-200 active:bg-red-100"
          >
            <Text className="text-center text-sm font-semibold text-red-600">
              Hoje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNextDay}
            className="p-2 rounded-lg active:bg-gray-100"
          >
            <ChevronRight size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Indicador offline */}
      {isOffline && (
        <View className="bg-yellow-50 border-b border-yellow-200 p-3 flex-row items-center gap-2">
          <Download size={16} color="#d97706" />
          <Text className="text-xs text-yellow-800 font-medium">
            Dados em cache (sem conexão)
          </Text>
        </View>
      )}

      {/* Mensagem de erro */}
      {error && (
        <View className="bg-red-50 border-b border-red-200 p-3 flex-row items-center gap-2">
          <AlertCircle size={16} color="#dc2626" />
          <Text className="text-xs text-red-700 font-medium flex-1">
            {error}
          </Text>
        </View>
      )}

      {/* Conteúdo da Liturgia */}
      {liturgy ? (
        <LiturgyReader liturgy={liturgy} />
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true)
                loadLiturgy(selectedDate)
              }}
              tintColor="#dc2626"
            />
          }
        >
          <View className="flex-1 justify-center items-center p-4">
            <AlertCircle size={48} color="#9ca3af" />
            <Text className="text-center text-gray-600 font-medium mt-4">
              Nenhuma liturgia disponível
            </Text>
            <Text className="text-center text-gray-500 text-sm mt-2">
              A liturgia para este dia não está disponível no momento.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setIsRefreshing(true)
                loadLiturgy(selectedDate)
              }}
              className="mt-6 px-4 py-2 bg-red-600 rounded-lg active:bg-red-700"
            >
              <Text className="text-white font-semibold">Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  )
}
