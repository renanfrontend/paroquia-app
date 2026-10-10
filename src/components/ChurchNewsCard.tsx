import { View, Text, TouchableOpacity, Image } from 'react-native'
import { BookOpen } from 'lucide-react-native'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CHURCH_NEWS_SOURCES, type ChurchNews } from '@/services/churchNewsService'
import { openInApp } from '@/lib/openInApp'

/** Manchete da Igreja: abre a matéria completa dentro do app (site da fonte, sem copiar o texto). */
export function ChurchNewsCard({ news }: { news: ChurchNews }) {
  const source = CHURCH_NEWS_SOURCES[news.source] ?? news.source
  const timeAgo = formatDistanceToNow(new Date(news.published_at), { addSuffix: true, locale: ptBR })

  return (
    <TouchableOpacity
      onPress={() => openInApp(news.link)}
      className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm active:opacity-80"
      accessibilityRole="link"
      accessibilityLabel={`${news.title}. ${source}. Ler a matéria completa`}
    >
      {news.image_url && (
        <Image source={{ uri: news.image_url }} className="h-40 w-full" resizeMode="cover" />
      )}
      <View className="p-4">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="rounded-full bg-gray-100 px-2 py-1">
            <Text className="text-xs font-semibold text-gray-700">{source}</Text>
          </View>
          <Text className="text-xs text-gray-500">{timeAgo}</Text>
        </View>
        <Text className="mb-1 text-base font-bold text-gray-900">{news.title}</Text>
        {news.summary && (
          <Text className="mb-3 text-sm text-gray-600" numberOfLines={3}>
            {news.summary}
          </Text>
        )}
        <View className="flex-row items-center gap-1">
          <BookOpen size={14} color="#dc2626" />
          <Text className="text-sm font-semibold text-red-600">Ler a matéria completa</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
