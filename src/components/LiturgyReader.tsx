import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { ZoomIn, ZoomOut } from 'lucide-react-native'
import { Database } from '@/types/database.types'

interface LiturgyReaderProps {
  liturgy: Database['public']['Tables']['daily_liturgy']['Row']
}

const LITURGY_COLOR_MAP: Record<string, string> = {
  VERDE: '#10b981',
  VERMELHO: '#dc2626',
  ROXO: '#7c3aed',
  BRANCO: '#f3f4f6',
  ROSA: '#ec4899',
}

export function LiturgyReader({ liturgy }: LiturgyReaderProps) {
  const [fontSize, setFontSize] = useState(16)
  const minFontSize = 14
  const maxFontSize = 24

  const handleZoom = (increase: boolean) => {
    setFontSize((prev) => {
      const newSize = increase ? prev + 2 : prev - 2
      return Math.min(Math.max(newSize, minFontSize), maxFontSize)
    })
  }

  const liturgyColor = LITURGY_COLOR_MAP[liturgy.liturgical_color] || '#10b981'
  const colorName =
    Object.entries(LITURGY_COLOR_MAP).find(([_, v]) => v === liturgyColor)?.[0] || 'VERDE'

  return (
    <View className="flex-1 bg-white">
      {/* Header com cor litúrgica */}
      <View
        style={{ backgroundColor: liturgyColor }}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-1">
          <Text className="text-xs text-white font-semibold opacity-75 mb-1">
            Cor Litúrgica do Dia
          </Text>
          <Text className="text-lg font-bold text-white">
            {colorName === 'BRANCO' ? 'Branco' : colorName}
          </Text>
        </View>

        {/* Controles de zoom */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleZoom(false)}
            disabled={fontSize === minFontSize}
            className={`p-2 rounded ${
              fontSize === minFontSize
                ? 'bg-white/30'
                : 'bg-white/50 active:bg-white'
            }`}
          >
            <ZoomOut size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleZoom(true)}
            disabled={fontSize === maxFontSize}
            className={`p-2 rounded ${
              fontSize === maxFontSize
                ? 'bg-white/30'
                : 'bg-white/50 active:bg-white'
            }`}
          >
            <ZoomIn size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo scrollável */}
      <ScrollView
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text
          style={{ fontSize: fontSize + 4 }}
          className="font-bold text-gray-900 mb-4 text-center"
        >
          {liturgy.title}
        </Text>

        {/* 1ª Leitura */}
        {liturgy.first_reading_text && (
          <View className="mb-6">
            <Text
              style={{ fontSize: fontSize - 2 }}
              className="font-bold text-gray-700 mb-2"
            >
              1ª Leitura
            </Text>
            {liturgy.first_reading_ref && (
              <Text
                style={{ fontSize: fontSize - 2 }}
                className="text-gray-600 font-semibold mb-2"
              >
                {liturgy.first_reading_ref}
              </Text>
            )}
            <Text
              style={{ fontSize }}
              className="text-gray-800 leading-relaxed"
            >
              {liturgy.first_reading_text}
            </Text>
          </View>
        )}

        {/* Salmo Responsorial */}
        {liturgy.psalm_text && (
          <View className="mb-6">
            <Text
              style={{ fontSize: fontSize - 2 }}
              className="font-bold text-gray-700 mb-2"
            >
              Salmo Responsorial
            </Text>
            {liturgy.psalm_ref && (
              <Text
                style={{ fontSize: fontSize - 2 }}
                className="text-gray-600 font-semibold mb-2"
              >
                {liturgy.psalm_ref}
              </Text>
            )}
            {liturgy.psalm_refrain && (
              <View className="mb-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                <Text
                  style={{ fontSize }}
                  className="text-yellow-900 font-semibold italic"
                >
                  Refrão: {liturgy.psalm_refrain}
                </Text>
              </View>
            )}
            <Text
              style={{ fontSize }}
              className="text-gray-800 leading-relaxed"
            >
              {liturgy.psalm_text}
            </Text>
          </View>
        )}

        {/* 2ª Leitura */}
        {liturgy.second_reading_text && (
          <View className="mb-6">
            <Text
              style={{ fontSize: fontSize - 2 }}
              className="font-bold text-gray-700 mb-2"
            >
              2ª Leitura
            </Text>
            {liturgy.second_reading_ref && (
              <Text
                style={{ fontSize: fontSize - 2 }}
                className="text-gray-600 font-semibold mb-2"
              >
                {liturgy.second_reading_ref}
              </Text>
            )}
            <Text
              style={{ fontSize }}
              className="text-gray-800 leading-relaxed"
            >
              {liturgy.second_reading_text}
            </Text>
          </View>
        )}

        {/* Evangelho */}
        {liturgy.gospel_text && (
          <View className="mb-6 p-3 bg-red-50 rounded border border-red-200">
            <Text
              style={{ fontSize: fontSize - 2 }}
              className="font-bold text-red-900 mb-2"
            >
              Evangelho
            </Text>
            {liturgy.gospel_ref && (
              <Text
                style={{ fontSize: fontSize - 2 }}
                className="text-red-800 font-semibold mb-2"
              >
                {liturgy.gospel_ref}
              </Text>
            )}
            <Text
              style={{ fontSize }}
              className="text-red-900 leading-relaxed font-semibold"
            >
              {liturgy.gospel_text}
            </Text>
          </View>
        )}

        {/* Reflexão */}
        {liturgy.reflection && (
          <View className="mb-6">
            <Text
              style={{ fontSize: fontSize - 2 }}
              className="font-bold text-gray-700 mb-2"
            >
              Reflexão Pastoral
            </Text>
            <Text
              style={{ fontSize }}
              className="text-gray-800 leading-relaxed italic"
            >
              {liturgy.reflection}
            </Text>
          </View>
        )}

        {/* Espaçador para scroll */}
        <View className="h-8" />
      </ScrollView>
    </View>
  )
}
