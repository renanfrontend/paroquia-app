import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export default function RegisterScreen() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (fullName.trim().length < 3) {
      newErrors.fullName = 'Informe seu nome completo'
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Informe um e-mail válido'
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return

    try {
      setIsSubmitting(true)
      setErrors({})

      /**
       * O trigger handle_new_user no Supabase cria automaticamente
       * a row em public.profiles usando raw_user_meta_data.full_name
       */
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ general: 'Este e-mail já está cadastrado' })
        } else {
          setErrors({ general: 'Erro ao criar conta. Tente novamente.' })
        }
        return
      }

      Alert.alert(
        '✅ Conta Criada',
        'Verifique seu e-mail para confirmar o cadastro antes de entrar.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      )
    } catch (error) {
      console.error('Register error:', error)
      setErrors({ general: 'Erro inesperado. Verifique sua conexão.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center p-6">
          {/* Voltar */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className="flex-row items-center gap-2 mb-6 self-start">
              <ArrowLeft size={20} color="#6b7280" />
              <Text className="text-sm text-gray-600 font-medium">Voltar</Text>
            </TouchableOpacity>
          </Link>

          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Criar Conta
          </Text>
          <Text className="text-sm text-gray-600 mb-8">
            Junte-se à nossa comunidade paroquial
          </Text>

          {/* Erro geral */}
          {errors.general && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-700 text-sm text-center">
                {errors.general}
              </Text>
            </View>
          )}

          {/* Nome Completo */}
          <View className="mb-4">
            <Text className="text-sm font-bold text-gray-700 mb-2">
              Nome Completo
            </Text>
            <View
              className={`flex-row items-center bg-gray-50 rounded-lg border px-3 ${
                errors.fullName ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <User size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 px-3 text-base text-gray-900"
                placeholder="Ex: João Batista de Souza"
                placeholderTextColor="#9ca3af"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text)
                  if (errors.fullName) {
                    setErrors((prev) => ({ ...prev, fullName: undefined }))
                  }
                }}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
            {errors.fullName && (
              <Text className="text-xs text-red-600 mt-1">
                {errors.fullName}
              </Text>
            )}
          </View>

          {/* E-mail */}
          <View className="mb-4">
            <Text className="text-sm font-bold text-gray-700 mb-2">
              E-mail
            </Text>
            <View
              className={`flex-row items-center bg-gray-50 rounded-lg border px-3 ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <Mail size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 px-3 text-base text-gray-900"
                placeholder="seu@email.com.br"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }))
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
              />
            </View>
            {errors.email && (
              <Text className="text-xs text-red-600 mt-1">{errors.email}</Text>
            )}
          </View>

          {/* Senha */}
          <View className="mb-4">
            <Text className="text-sm font-bold text-gray-700 mb-2">Senha</Text>
            <View
              className={`flex-row items-center bg-gray-50 rounded-lg border px-3 ${
                errors.password ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <Lock size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 px-3 text-base text-gray-900"
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                className="p-1"
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9ca3af" />
                ) : (
                  <Eye size={20} color="#9ca3af" />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="text-xs text-red-600 mt-1">
                {errors.password}
              </Text>
            )}
          </View>

          {/* Confirmar Senha */}
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-700 mb-2">
              Confirmar Senha
            </Text>
            <View
              className={`flex-row items-center bg-gray-50 rounded-lg border px-3 ${
                errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <Lock size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 px-3 text-base text-gray-900"
                placeholder="Repita a senha"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text)
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({
                      ...prev,
                      confirmPassword: undefined,
                    }))
                  }
                }}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
              />
            </View>
            {errors.confirmPassword && (
              <Text className="text-xs text-red-600 mt-1">
                {errors.confirmPassword}
              </Text>
            )}
          </View>

          {/* Botão Criar Conta */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isSubmitting}
            className={`py-4 rounded-lg items-center ${
              isSubmitting ? 'bg-red-400' : 'bg-red-600 active:bg-red-700'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-base font-bold text-white">
                Criar Conta
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
