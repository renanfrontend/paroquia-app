import React from 'react'
import { Tabs } from 'expo-router'
import { Dimensions } from 'react-native'
import {
  Clock,
  BookOpen,
  Megaphone,
  Heart,
  DollarSign,
} from 'lucide-react-native'

const TAB_BAR_HEIGHT = 70
const ICON_SIZE = 24

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          height: TAB_BAR_HEIGHT,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomColor: '#e5e7eb',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#111827',
        },
        headerTintColor: '#1f2937',
      }}
    >
      {/* Missas e Celebrações */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Missas',
          headerTitle: 'Horários de Celebrações',
          tabBarLabel: 'Missas',
          tabBarIcon: ({ color }) => (
            <Clock size={ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* Liturgia Diária */}
      <Tabs.Screen
        name="liturgia"
        options={{
          title: 'Liturgia',
          headerTitle: 'Liturgia Diária',
          tabBarLabel: 'Liturgia',
          tabBarIcon: ({ color }) => (
            <BookOpen size={ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* Mural de Notícias */}
      <Tabs.Screen
        name="noticias"
        options={{
          title: 'Notícias',
          headerTitle: 'Mural de Avisos',
          tabBarLabel: 'Notícias',
          tabBarIcon: ({ color }) => (
            <Megaphone size={ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* Pedidos de Oração */}
      <Tabs.Screen
        name="oracoes"
        options={{
          title: 'Orações',
          headerTitle: 'Comunidade de Oração',
          tabBarLabel: 'Orações',
          tabBarIcon: ({ color }) => (
            <Heart size={ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* Dízimo via PIX */}
      <Tabs.Screen
        name="dizimo"
        options={{
          title: 'Dízimo',
          headerTitle: 'Dízimo e Ofertas',
          tabBarLabel: 'Dízimo',
          tabBarIcon: ({ color }) => (
            <DollarSign size={ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  )
}
