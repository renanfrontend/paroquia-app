import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { X, Send, Lock } from 'lucide-react-native'
import { prayerService } from '@/services/prayerService'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type PrayerCategory = Database['public']['Enums']['prayer_category']

const CATEGORY_OPTIONS: { value: PrayerCategory; label: string }[] = [
  { value: 'SAUDE', label: '🏥 Saúde' },
  { value: 'FAMILIA', label: '👨‍👩‍👧‍👦 Família' },
  { value: 'AGRADECIMENTO', label: '🙏 Agradecimento' },
  { value: 'FALECIMENTO', label: '⚰️ Falecimento' },
  { value: 'INTENCAO_GERAL', label: '✨ Intenção Geral' },
]

const MIN_INTENTION_LENGTH = 10
const MAX_INTENTION_LENGTH = 500

interface FormErrors {
  authorName?: string
  intention?: string
}

export default function NovoPedidoOracaoModal() {
  const router = useRouter()

  const [authorName, setAuthorName] = useState('')
  const [intention, setIntention] = useState('')
  const [category, setCategory] = useState<PrayerCategory>('INTENCAO_GERAL')
  const [isPrivate, setIsPrivate] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Validação do formulário
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (authorName.trim().length < 2) {
      newErrors.authorName = 'Informe seu nome (mínimo 2 caracteres)'
    }

    if (intention.trim().length < MIN_INTENTION_LENGTH) {
      newErrors.intention = `A intenção deve ter pelo menos ${MIN_INTENTION_LENGTH} caracteres`
    }

    if (intention.trim().length > MAX_INTENTION_LENGTH) {
      newErrors.intention = `A intenção deve ter no máximo ${MAX_INTENTION_LENGTH} caracteres`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Submit do pedido
   */
  const handleSubmit = async () => {
    if (!validate()) return

    try {
      setIsSubmitting(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      await prayerService.createPrayerRequest({
        user_id: user?.id ?? null,
        author_name: authorName.trim(),
        intention: intention.trim(),
        category,
        is_private: isPrivate,
      })

      Alert.alert(
        '🙏 Pedido Enviado',
        isPrivate
          ? 'Sua intenção confidencial foi encaminhada ao pároco.'
          : 'Sua intenção foi publicada no mural de orações.',
        [{ text: 'Amém', onPress: () => router.back() }],
      )
    } catch (error) {
      console.error('Error submitting prayer request:', error)
      Alert.alert('Erro', 'Não foi possível enviar seu pedido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {/* Header do modal */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-lg font-bold text-gray-900">
          Novo Pedido de Oração
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full active:bg-gray-100"
          accessibilityLabel="Fechar"
        >
          <X size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        {/* Nome */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 mb-2">
            Seu Nome *
          </Text>
          <TextInput
            className={`bg-gray-50 px-4 py-3 rounded-lg border text-base text-gray-900 ${
              errors.authorName ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Ex: Maria Aparecida"
            placeholderTextColor="#9ca3af"
            value={authorName}
            onChangeText={(text) => {
              setAuthorName(text)
              if (errors.authorName) {
                setErrors((prev) => ({ ...prev, authorName: undefined }))
              }
            }}
            maxLength={80}
            autoCapitalize="words"
          />
          {errors.authorName && (
            <Text className="text-xs text-red-600 mt-1">
              {errors.authorName}
            </Text>
          )}
        </View>

        {/* Categoria */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 mb-2">
            Categoria *
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setCategory(option.value)}
                className={`px-3 py-2 rounded-lg border ${
                  category === option.value
                    ? 'bg-red-600 border-red-700'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    category === option.value ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Intenção */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 mb-2">
            Sua Intenção *
          </Text>
          <TextInput
            className={`bg-gray-50 px-4 py-3 rounded-lg border text-base text-gray-900 min-h-[120px] ${
              errors.intention ? 'border-red-400' : 'border-gray-300'
            }`}
            placeholder="Escreva aqui sua intenção de oração..."
            placeholderTextColor="#9ca3af"
            value={intention}
            onChangeText={(text) => {
              setIntention(text)
              if (errors.intention) {
                setErrors((prev) => ({ ...prev, intention: undefined }))
              }
            }}
            multiline
            textAlignVertical="top"
            maxLength={MAX_INTENTION_LENGTH}
          />
          <View className="flex-row justify-between mt-1">
            {errors.intention ? (
              <Text className="text-xs text-red-600 flex-1">
                {errors.intention}
              </Text>
            ) : (
              <View className="flex-1" />
            )}
            <Text className="text-xs text-gray-500">
              {intention.length}/{MAX_INTENTION_LENGTH}
            </Text>
          </View>
        </View>

        {/* Toggle Confidencial */}
        <View className="mb-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-2 mr-3">
              <Lock size={18} color="#b45309" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-yellow-900">
                  Intenção Confidencial
                </Text>
                <Text className="text-xs text-yellow-800 mt-1">
                  Não aparece no mural público. Vai direto para a lista de
                  intercessão do pároco.
                </Text>
              </View>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#d1d5db', true: '#dc2626' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Botão de envio */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`flex-row items-center justify-center gap-2 py-4 rounded-lg ${
            isSubmitting ? 'bg-red-400' : 'bg-red-600 active:bg-red-700'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Send size={20} color="#ffffff" />
          )}
          <Text className="text-base font-bold text-white">
            {isSubmitting ? 'Enviando...' : 'Enviar Pedido de Oração'}
          </Text>
        </TouchableOpacity>

        <View className="h-12" />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
