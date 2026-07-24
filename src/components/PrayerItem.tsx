import React, { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Heart, Flame } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PrayerItemProps {
  prayer: Database['public']['Tables']['prayer_requests']['Row']
  onUpdate?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  SAUDE: '🏥 Saúde',
  FAMILIA: '👨‍👩‍👧‍👦 Família',
  AGRADECIMENTO: '🙏 Agradecimento',
  FALECIMENTO: '⚰️ Falecimento',
  INTENCAO_GERAL: '✨ Intenção Geral',
}

export function PrayerItem({ prayer, onUpdate }: PrayerItemProps) {
  const [isIncrementing, setIsIncrementing] = useState(false)
  const [localPrayersCount, setLocalPrayersCount] = useState(
    prayer.prayers_count,
  )
  const [localCandlesCount, setLocalCandlesCount] = useState(
    prayer.candles_lit,
  )

  /**
   * Incrementar contador de "Rezei por você"
   * Atualiza em tempo real com Supabase RealTime
   */
  const handlePrayed = async () => {
    try {
      setIsIncrementing(true)

      // Criar registro de intercessão
      const { error: insertError } = await supabase
        .from('prayer_supports')
        .insert({
          prayer_id: prayer.id,
        })

      if (insertError) throw insertError

      // Atualizar contador de orações
      const { error: updateError } = await supabase
        .from('prayer_requests')
        .update({
          prayers_count: localPrayersCount + 1,
        })
        .eq('id', prayer.id)

      if (updateError) throw updateError

      setLocalPrayersCount((prev) => prev + 1)
      onUpdate?.()
    } catch (error) {
      console.error('Error incrementing prayer count:', error)
    } finally {
      setIsIncrementing(false)
    }
  }

  /**
   * Acender vela virtual
   */
  const handleLightCandle = async () => {
    try {
      setIsIncrementing(true)

      const { error } = await supabase
        .from('prayer_requests')
        .update({
          candles_lit: localCandlesCount + 1,
        })
        .eq('id', prayer.id)

      if (error) throw error

      setLocalCandlesCount((prev) => prev + 1)
      onUpdate?.()
    } catch (error) {
      console.error('Error lighting candle:', error)
    } finally {
      setIsIncrementing(false)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(prayer.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <View className="card mb-3">
      {/* Categoria e autor */}
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-xs font-semibold text-gray-600">
          {CATEGORY_LABELS[prayer.category]}
        </Text>
        <Text className="text-xs text-gray-500">{timeAgo}</Text>
      </View>

      {/* Autor (se não confidencial) */}
      {!prayer.is_private && (
        <Text className="text-xs text-gray-500 mb-1">
          Por {prayer.author_name}
        </Text>
      )}

      {/* Intenção */}
      <Text className="text-base text-gray-800 font-medium mb-3 leading-5">
        {prayer.intention}
      </Text>

      {/* Status de confidencialidade */}
      {prayer.is_private && (
        <View className="bg-yellow-50 p-2 rounded mb-3 border border-yellow-200">
          <Text className="text-xs text-yellow-700 font-semibold">
            🔒 Intenção Confidencial (Somente Padre)
          </Text>
        </View>
      )}

      {/* Contadores interativos */}
      <View className="flex-row gap-2">
        {/* Botão "Rezei por você" */}
        <TouchableOpacity
          onPress={handlePrayed}
          disabled={isIncrementing}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 bg-red-50 rounded-lg border border-red-200 active:bg-red-100"
        >
          <Heart size={16} color="#dc2626" fill="#dc2626" />
          <Text className="text-xs font-semibold text-red-700">
            {localPrayersCount}
          </Text>
        </TouchableOpacity>

        {/* Botão "Acender Vela" */}
        <TouchableOpacity
          onPress={handleLightCandle}
          disabled={isIncrementing}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 bg-yellow-50 rounded-lg border border-yellow-200 active:bg-yellow-100"
        >
          <Flame size={16} color="#d97706" fill="#d97706" />
          <Text className="text-xs font-semibold text-yellow-700">
            {localCandlesCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
