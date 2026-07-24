import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { PixCopyButton } from '@/components/PixCopyButton'
import { pixService } from '@/services/pixService'
import { Database } from '@/types/database.types'
import { QrCode, AlertCircle, Zap } from 'lucide-react-native'

type TitheInfo = Database['public']['Tables']['tithe_info']['Row']

const SUGGESTED_AMOUNTS = [20, 50, 100, 200]

export default function DizimoScreen() {
  const router = useRouter()
  const [titheInfo, setTitheInfo] = useState<TitheInfo | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Carregar dados do PIX da paróquia
   */
  const loadTitheInfo = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await pixService.getTitheInfo()

      if (!data) {
        setError(
          'Dados de PIX não configurados. Contate o administrador paroquial.',
        )
        return
      }

      setTitheInfo(data)
    } catch (err) {
      console.error('Error loading tithe info:', err)
      setError('Erro ao carregar dados de PIX. Tente novamente.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadTitheInfo()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      loadTitheInfo()
    }, []),
  )

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  if (!titheInfo) {
    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true)
              loadTitheInfo()
            }}
            tintColor="#dc2626"
          />
        }
      >
        <View className="p-4 pt-12">
          <View className="bg-red-50 border border-red-200 rounded-lg p-4">
            <View className="flex-row items-center gap-3 mb-2">
              <AlertCircle size={24} color="#dc2626" />
              <Text className="text-red-900 font-bold text-base flex-1">
                Erro ao carregar dados
              </Text>
            </View>
            <Text className="text-red-800 text-sm">{error}</Text>
          </View>
        </View>
      </ScrollView>
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
            loadTitheInfo()
          }}
          tintColor="#dc2626"
        />
      }
    >
      <View className="p-4">
        {/* Header com logo e nome paroquial */}
        <View className="bg-white rounded-lg p-4 mb-6 items-center">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {titheInfo.parish_name}
          </Text>
          <Text className="text-sm text-gray-600">
            CNPJ: {pixService.formatCNPJ(titheInfo.cnpj)}
          </Text>
        </View>

        {/* Mensagem de contexto */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-blue-900 font-semibold text-base mb-2">
            💝 O Dízimo na Nossa Comunidade
          </Text>
          <Text className="text-blue-800 text-sm leading-5">
            {titheInfo.custom_message}
          </Text>
        </View>

        {/* Chave PIX para cópia */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-3 uppercase">
            Formas de Contribuir
          </Text>
          <PixCopyButton
            pixKey={titheInfo.pix_key}
            pixKeyType={titheInfo.pix_key_type as 'CNPJ' | 'CPF' | 'EMAIL' | 'TELEFONE'}
            parishName={titheInfo.parish_name}
          />
        </View>

        {/* QR Code */}
        <TouchableOpacity
          onPress={() => router.push('/modals/pix-qr-modal')}
          className="bg-white rounded-lg p-6 mb-6 items-center border border-gray-200 active:bg-gray-50"
        >
          <View className="bg-gray-100 p-4 rounded-lg mb-3">
            <QrCode size={32} color="#6b7280" />
          </View>
          <Text className="text-gray-900 font-bold mb-1">QR Code PIX</Text>
          <Text className="text-gray-600 text-sm text-center">
            Scaneie o QR Code com seu celular
          </Text>
        </TouchableOpacity>

        {/* Valores sugeridos */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-3 uppercase">
            Valores Sugeridos
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SUGGESTED_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => setSelectedAmount(amount)}
                className={`flex-1 min-w-[45%] py-3 rounded-lg border-2 active:opacity-75 ${
                  selectedAmount === amount
                    ? 'bg-red-600 border-red-700'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-center font-bold ${
                    selectedAmount === amount
                      ? 'text-white'
                      : 'text-gray-900'
                  }`}
                >
                  R$ {amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Valor customizado */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-2 uppercase">
            Ou defina um valor
          </Text>
          <TouchableOpacity className="px-4 py-3 bg-white rounded-lg border border-gray-300 active:bg-gray-50">
            <Text className="text-gray-600">Valor Livre (BRL)</Text>
          </TouchableOpacity>
        </View>

        {/* Sobre a importância do Dízimo */}
        <View className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Zap size={20} color="#7c3aed" />
            <Text className="text-purple-900 font-bold">
              Por que o Dízimo?
            </Text>
          </View>

          <Text className="text-purple-800 text-sm leading-5 mb-2">
            <Text className="font-semibold">1. Ato de Fé:</Text> O dízimo é
            uma expressão de confiança em Deus e reconhecimento de Sua
            providência.
          </Text>

          <Text className="text-purple-800 text-sm leading-5 mb-2">
            <Text className="font-semibold">2. Coresponsabilidade:</Text> Ao
            contribuir, você participa ativamente da manutenção espiritual e
            material da paróquia.
          </Text>

          <Text className="text-purple-800 text-sm leading-5">
            <Text className="font-semibold">3. Obras Sociais:</Text> Seus
            dízimos sustentam programas de assistência social e educação
            cristã.
          </Text>
        </View>

        {/* Dados bancários (se houver) */}
        {titheInfo.account_info && (
          <View className="bg-gray-100 rounded-lg p-4 mb-6">
            <Text className="text-gray-900 font-bold mb-2">
              Transferência Bancária
            </Text>
            <Text className="text-gray-700 text-sm font-mono">
              {titheInfo.account_info}
            </Text>
          </View>
        )}

        {/* Contato paroquial */}
        <View className="bg-white rounded-lg p-4 border border-gray-200 mb-8">
          <Text className="text-gray-900 font-bold mb-2">Dúvidas?</Text>
          <Text className="text-gray-700 text-sm mb-2">
            Fale com o padre ou a secretaria paroquial
          </Text>
          <Text className="text-red-600 font-semibold text-sm">
            paroquia@exemplo.com.br
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}
