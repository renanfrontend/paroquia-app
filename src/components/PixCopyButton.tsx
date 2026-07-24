import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { Copy, CheckCircle } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'

interface PixCopyButtonProps {
  pixKey: string
  pixKeyType: 'CNPJ' | 'CPF' | 'EMAIL' | 'TELEFONE'
  parishName: string
  value?: number
}

export function PixCopyButton({
  pixKey,
  pixKeyType,
  parishName,
  value,
}: PixCopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(pixKey)
      setIsCopied(true)

      // Reset após 2 segundos
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)

      Alert.alert(
        '✅ Chave PIX Copiada',
        `A chave PIX foi copiada para a área de transferência.\n\nAbra seu app bancário e cole a chave para transferir.`,
      )
    } catch (error) {
      console.error('Error copying PIX key:', error)
      Alert.alert('Erro', 'Não foi possível copiar a chave PIX')
    }
  }

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      CNPJ: 'CNPJ',
      CPF: 'CPF',
      EMAIL: 'Email',
      TELEFONE: 'Telefone',
    }
    return labels[pixKeyType] || 'PIX'
  }

  return (
    <View className="mb-4">
      {/* Display da chave */}
      <View className="bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
        <Text className="text-xs text-gray-600 font-semibold mb-1">
          Chave PIX ({getTypeLabel()})
        </Text>
        <Text className="text-sm font-mono text-gray-900 break-words">
          {pixKey}
        </Text>
      </View>

      {/* Botão de copiar */}
      <TouchableOpacity
        onPress={handleCopy}
        className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold ${
          isCopied
            ? 'bg-green-600 active:bg-green-700'
            : 'bg-red-600 active:bg-red-700'
        }`}
      >
        {isCopied ? (
          <>
            <CheckCircle size={20} color="#ffffff" />
            <Text className="text-base font-bold text-white">
              Chave Copiada!
            </Text>
          </>
        ) : (
          <>
            <Copy size={20} color="#ffffff" />
            <Text className="text-base font-bold text-white">
              Copiar Chave PIX
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Instruções */}
      <View className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Text className="text-xs text-blue-900 leading-4">
          💡 <Text className="font-semibold">Instrução:</Text> Abra seu app
          bancário, escolha a opção "Transferência PIX", selecione "Copia e
          Cola" e cole a chave acima.
        </Text>
      </View>
    </View>
  )
}
