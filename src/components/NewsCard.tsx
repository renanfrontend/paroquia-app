import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, Share } from 'react-native'
import { Heart, Share2, Pin } from 'lucide-react-native'
import { Database } from '@/types/database.types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

interface NewsCardProps {
  news: Database['public']['Tables']['news_posts']['Row']
  onLike?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  AVISO: 'bg-red-100 text-red-700',
  EVENTO: 'bg-blue-100 text-blue-700',
  PASTORAL: 'bg-purple-100 text-purple-700',
  FESTA: 'bg-yellow-100 text-yellow-700',
  CATEQUESE: 'bg-green-100 text-green-700',
}

const CATEGORY_LABELS: Record<string, string> = {
  AVISO: '📌 Aviso',
  EVENTO: '🎉 Evento',
  PASTORAL: '🙏 Pastoral',
  FESTA: '✨ Festa',
  CATEQUESE: '📚 Catequese',
}

export function NewsCard({ news, onLike }: NewsCardProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [localLikesCount, setLocalLikesCount] = useState(news.likes_count)

  const handleLike = async () => {
    try {
      setIsLiking(true)

      const { error } = await supabase
        .from('news_posts')
        .update({
          likes_count: localLikesCount + 1,
        })
        .eq('id', news.id)

      if (error) throw error

      setLocalLikesCount((prev) => prev + 1)
      onLike?.()
    } catch (error) {
      console.error('Error liking news:', error)
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${news.title}\n\n${news.summary}\n\nVia Paróquia App`,
        title: news.title,
        url: 'https://paroquia-app.com', // URL real da paróquia
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(news.published_at), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <View className="card mb-3 overflow-hidden">
      {/* Imagem (se houver) */}
      {news.image_url && (
        <Image
          source={{ uri: news.image_url }}
          className="w-full h-40 mb-3"
          resizeMode="cover"
        />
      )}

      {/* Header com categoria e pin */}
      <View className="flex-row items-center justify-between mb-2">
        <Text
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            CATEGORY_COLORS[news.category]
          }`}
        >
          {CATEGORY_LABELS[news.category]}
        </Text>

        {news.is_pinned && (
          <Pin size={16} color="#dc2626" fill="#dc2626" />
        )}
      </View>

      {/* Título */}
      <Text className="text-lg font-bold text-gray-900 mb-2">
        {news.title}
      </Text>

      {/* Resumo */}
      <Text className="text-sm text-gray-700 mb-3 leading-5">
        {news.summary}
      </Text>

      {/* Data de publicação */}
      <Text className="text-xs text-gray-500 mb-3">{timeAgo}</Text>

      {/* Botões de ação */}
      <View className="flex-row gap-2 pt-3 border-t border-gray-100">
        {/* Botão Like */}
        <TouchableOpacity
          onPress={handleLike}
          disabled={isLiking}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 rounded-lg active:bg-red-50"
        >
          <Heart
            size={16}
            color={localLikesCount > 0 ? '#dc2626' : '#9ca3af'}
            fill={localLikesCount > 0 ? '#dc2626' : 'none'}
          />
          <Text
            className={`text-sm font-semibold ${
              localLikesCount > 0 ? 'text-red-600' : 'text-gray-600'
            }`}
          >
            {localLikesCount}
          </Text>
        </TouchableOpacity>

        {/* Botão Compartilhar */}
        <TouchableOpacity
          onPress={handleShare}
          className="flex-1 flex-row items-center justify-center gap-2 py-2 px-3 rounded-lg active:bg-gray-100"
        >
          <Share2 size={16} color="#6b7280" />
          <Text className="text-sm font-semibold text-gray-600">
            Compartilhar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
