import React from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { Filter } from 'lucide-react-native'
import { MassScheduleCard } from '@/components/MassScheduleCard'
import { useMasses } from '@/hooks/useMasses'
import { Database } from '@/types/database.types'

type DayOfWeek = Database['public']['Enums']['day_of_week']
type MassType = Database['public']['Enums']['mass_type']

const DAYS_OF_WEEK: DayOfWeek[] = [
  'DOMINGO',
  'SEGUNDA',
  'TERCA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SABADO',
]

const DAY_LABELS: Record<DayOfWeek, string> = {
  DOMINGO: 'Dom',
  SEGUNDA: 'Seg',
  TERCA: 'Ter',
  QUARTA: 'Qua',
  QUINTA: 'Qui',
  SEXTA: 'Sex',
  SABADO: 'Sáb',
}

const MASS_TYPE_OPTIONS: { value: MassType; label: string }[] = [
  { value: 'MISSA', label: 'Missa' },
  { value: 'CONFISSAO', label: 'Confissão' },
  { value: 'ADORACAO', label: 'Adoração' },
  { value: 'TERCO', label: 'Terço' },
  { value: 'NOVENA', label: 'Novena' },
]

export default function MassesScreen() {
  const {
    filteredMasses,
    upcomingMass,
    selectedDay,
    selectedType,
    isLoading,
    error,
    setSelectedDay,
    setSelectedType,
    reload,
  } = useMasses()

  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await reload()
    setIsRefreshing(false)
  }

  if (isLoading && !isRefreshing) {
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
          onRefresh={handleRefresh}
          tintColor="#dc2626"
        />
      }
    >
      <View className="p-4">
        {/* Próxima Missa em Destaque */}
        {upcomingMass && (
          <View className="mb-6">
            <Text className="text-xs font-bold text-gray-600 mb-2 uppercase">
              Próxima Celebração
            </Text>
            <MassScheduleCard schedule={upcomingMass} isUpcoming />
          </View>
        )}

        {/* Mensagem de erro */}
        {error && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        {/* Filtro por dia da semana */}
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-600 mb-2 uppercase">
            Dia da Semana
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedDay === day
                      ? 'bg-red-600'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      selectedDay === day ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Filtro por tipo de celebração */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <Filter size={16} color="#6b7280" />
            <Text className="text-xs font-bold text-gray-600 uppercase">
              Tipo
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setSelectedType('ALL')}
                className={`px-3 py-2 rounded-lg ${
                  selectedType === 'ALL'
                    ? 'bg-red-600'
                    : 'bg-white border border-gray-300'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedType === 'ALL' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Todos
                </Text>
              </TouchableOpacity>

              {MASS_TYPE_OPTIONS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setSelectedType(value)}
                  className={`px-3 py-2 rounded-lg ${
                    selectedType === value
                      ? 'bg-red-600'
                      : 'bg-white border border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selectedType === value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lista de Missas */}
        {filteredMasses.length > 0 ? (
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              {filteredMasses.length} celebração(ões) encontrada(s)
            </Text>
            {filteredMasses.map((mass) => (
              <MassScheduleCard key={mass.id} schedule={mass} />
            ))}
          </View>
        ) : (
          <View className="py-8 items-center">
            <Text className="text-gray-600 font-medium mb-2">
              Nenhuma celebração encontrada
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              Não há celebrações agendadas para este dia e tipo.
            </Text>
          </View>
        )}

        <View className="h-8" />
      </View>
    </ScrollView>
  )
}
