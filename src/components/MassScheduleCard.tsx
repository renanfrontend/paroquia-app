import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Bell, MapPin, User } from 'lucide-react-native'
import * as Notifications from 'expo-notifications'
import { format, parse } from 'date-fns'
import { Database } from '@/types/database.types'

interface MassScheduleCardProps {
  schedule: Database['public']['Tables']['mass_schedules']['Row']
  isUpcoming?: boolean
}

const TYPE_LABELS: Record<string, string> = {
  MISSA: 'Missa',
  CONFISSAO: 'Confissão',
  ADORACAO: 'Adoração',
  TERCO: 'Terço',
  NOVENA: 'Novena',
}

const TYPE_COLORS: Record<string, string> = {
  MISSA: 'bg-red-100 text-red-700',
  CONFISSAO: 'bg-blue-100 text-blue-700',
  ADORACAO: 'bg-yellow-100 text-yellow-700',
  TERCO: 'bg-purple-100 text-purple-700',
  NOVENA: 'bg-pink-100 text-pink-700',
}

export function MassScheduleCard({
  schedule,
  isUpcoming = false,
}: MassScheduleCardProps) {
  const [hasNotification, setHasNotification] = useState(false)

  const handleSetReminder = async () => {
    try {
      /**
       * Agendar notificação local para 30 min antes da missa
       * Em produção, usar Expo Notifications com backend
       */
      const [hours, minutes] = schedule.time.split(':').map(Number)
      const notificationTime = new Date()
      notificationTime.setHours(hours, minutes - 30, 0, 0)

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Lembrete de Missa',
          body: `${TYPE_LABELS[schedule.type]} em ${schedule.location} em 30 minutos`,
          sound: true,
        },
        trigger: notificationTime,
      })

      setHasNotification(true)
      Alert.alert('Lembrete Agendado', 'Você receberá um lembrete 30 minutos antes')
    } catch (error) {
      console.error('Error setting reminder:', error)
      Alert.alert('Erro', 'Não foi possível agendar o lembrete')
    }
  }

  return (
    <View
      className={`card mb-3 ${isUpcoming ? 'border-l-4 border-l-red-600' : ''}`}
    >
      {/* Header com tipo e localização */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text
            className={`text-xs font-bold px-3 py-1 rounded-full self-start ${
              TYPE_COLORS[schedule.type]
            }`}
          >
            {TYPE_LABELS[schedule.type]}
          </Text>
        </View>

        {isUpcoming && (
          <View className="px-2 py-1 bg-red-50 rounded">
            <Text className="text-xs font-semibold text-red-600">
              Próxima
            </Text>
          </View>
        )}
      </View>

      {/* Hora */}
      <Text className="text-2xl font-bold text-gray-900 mb-2">
        {schedule.time}h
      </Text>

      {/* Localização */}
      <View className="flex-row items-center gap-2 mb-2">
        <MapPin size={16} color="#6b7280" />
        <Text className="text-sm text-gray-700 flex-1">
          {schedule.location}
        </Text>
      </View>

      {/* Celebrante (se houver) */}
      {schedule.celebrant && (
        <View className="flex-row items-center gap-2 mb-2">
          <User size={16} color="#6b7280" />
          <Text className="text-sm text-gray-600">{schedule.celebrant}</Text>
        </View>
      )}

      {/* Descrição (se houver) */}
      {schedule.description && (
        <Text className="text-xs text-gray-600 italic mb-3 p-2 bg-gray-50 rounded">
          {schedule.description}
        </Text>
      )}

      {/* Botão de lembrete */}
      <TouchableOpacity
        onPress={handleSetReminder}
        disabled={hasNotification}
        className={`flex-row items-center justify-center gap-2 py-2 px-3 rounded-lg border ${
          hasNotification
            ? 'bg-green-50 border-green-300'
            : 'bg-gray-50 border-gray-300'
        }`}
      >
        <Bell size={16} color={hasNotification ? '#059669' : '#6b7280'} />
        <Text
          className={`text-sm font-semibold ${
            hasNotification ? 'text-green-700' : 'text-gray-700'
          }`}
        >
          {hasNotification ? 'Lembrete Agendado' : 'Agendar Lembrete'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
