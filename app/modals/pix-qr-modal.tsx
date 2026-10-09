import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import QRCode from 'react-native-qrcode-svg'
import * as Clipboard from 'expo-clipboard'
import { X, Copy, Share2, CheckCircle } from 'lucide-react-native'
import { pixService } from '@/services/pixService'
import { Database } from '@/types/database.types'

type TitheInfo = Database['public']['Tables']['tithe_info']['Row']

const SUGGESTED_AMOUNTS = [20, 50, 100, 200] as const

export default function PixQrModal() {
  const router = useRouter()

  const [titheInfo, setTitheInfo] = useState<TitheInfo | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await pixService.getTitheInfo()
        setTitheInfo(data)
      } catch (error) {
        console.error('Error loading tithe info:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  /**
   * Payload PIX regenerado quando o valor selecionado muda.
   * Sem valor selecionado = QR estático (fiel define no app do banco).
   */
  const pixPayload = useMemo(() => {
    if (!titheInfo) return ''
    return pixService.generatePixQrCodeString(
      titheInfo.pix_key,
      selectedAmount ?? undefined,
    )
  }, [titheInfo, selectedAmount])

  const handleCopyPayload = async () => {
    try {
      await Clipboard.setStringAsync(pixPayload)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Error copying PIX payload:', error)
      Alert.alert('Erro', 'Não foi possível copiar o código PIX')
    }
  }

  const handleShare = async () => {
    if (!titheInfo) return
    try {
      await Share.share({
        message: `Contribua com o dízimo da ${titheInfo.parish_name} via PIX:\n\n${pixPayload}`,
        title: `PIX - ${titheInfo.parish_name}`,
      })
    } catch (error) {
      console.error('Error sharing PIX:', error)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  if (!titheInfo) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-end p-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 rounded-full active:bg-gray-100"
          >
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-gray-700 font-medium text-center">
            Dados de PIX não configurados. Contate a secretaria paroquial.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-lg font-bold text-gray-900">QR Code PIX</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full active:bg-gray-100"
          accessibilityLabel="Fechar"
        >
          <X size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Identificação da paróquia */}
        <View className="items-center mb-6">
          <Text className="text-xl font-bold text-gray-900 text-center">
            {titheInfo.parish_name}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            CNPJ: {pixService.formatCNPJ(titheInfo.cnpj)}
          </Text>
        </View>

        {/* QR Code */}
        <View className="items-center mb-6">
          <View className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
            <QRCode
              value={pixPayload}
              size={220}
              backgroundColor="#ffffff"
              color="#111827"
            />
          </View>
          <Text className="text-xs text-gray-500 mt-3 text-center px-8">
            Abra o app do seu banco, escolha "Pagar com PIX" e aponte a câmera
            para o código
          </Text>
        </View>

        {/* Seletor de valor */}
        <View className="mb-6">
          <Text className="text-sm font-bold text-gray-700 mb-3 uppercase">
            Valor da Contribuição
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => setSelectedAmount(null)}
              className={`px-4 py-3 rounded-lg border-2 ${
                selectedAmount === null
                  ? 'bg-red-600 border-red-700'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text
                className={`font-bold ${
                  selectedAmount === null ? 'text-white' : 'text-gray-900'
                }`}
              >
                Livre
              </Text>
            </TouchableOpacity>

            {SUGGESTED_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => setSelectedAmount(amount)}
                className={`px-4 py-3 rounded-lg border-2 ${
                  selectedAmount === amount
                    ? 'bg-red-600 border-red-700'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`font-bold ${
                    selectedAmount === amount ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {pixService.formatCurrency(amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedAmount !== null && (
            <Text className="text-xs text-gray-500 mt-2">
              QR Code atualizado com o valor de{' '}
              {pixService.formatCurrency(selectedAmount)}
            </Text>
          )}
        </View>

        {/* Ações */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            onPress={handleCopyPayload}
            className={`flex-row items-center justify-center gap-2 py-4 rounded-lg ${
              isCopied ? 'bg-green-600' : 'bg-red-600 active:bg-red-700'
            }`}
          >
            {isCopied ? (
              <CheckCircle size={20} color="#ffffff" />
            ) : (
              <Copy size={20} color="#ffffff" />
            )}
            <Text className="text-base font-bold text-white">
              {isCopied ? 'Código Copiado!' : 'Copiar Código PIX'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center gap-2 py-4 rounded-lg bg-gray-100 border border-gray-300 active:bg-gray-200"
          >
            <Share2 size={20} color="#374151" />
            <Text className="text-base font-bold text-gray-800">
              Compartilhar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nota de segurança */}
        <View className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-8">
          <Text className="text-xs text-blue-900 leading-4">
            🔒 <Text className="font-semibold">Segurança:</Text> Este
            aplicativo não armazena senhas nem dados bancários. O pagamento é
            processado inteiramente no aplicativo do seu banco.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}
