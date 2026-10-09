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
} from 'react-native'
import { Link } from 'expo-router'
import { Mail, Lock, Eye, EyeOff, Church } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Informe um e-mail válido'
    }

    if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return

    try {
      setIsSubmitting(true)
      setErrors({})

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'E-mail ou senha incorretos' })
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({
            general: 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
          })
        } else {
          setErrors({ general: 'Erro ao entrar. Tente novamente.' })
        }
        return
      }

      // Redirect é feito pelo listener de auth no root _layout
    } catch (error) {
      console.error('Login error:', error)
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
          {/* Logo / Identidade */}
          <View className="items-center mb-10">
            <View className="bg-red-50 p-5 rounded-full mb-4">
              <Church size={48} color="#dc2626" strokeWidth={1.5} />
            </View>
            <Text className="text-3xl font-bold text-gray-900">
              Paróquia Conectada
            </Text>
            <Text className="text-sm text-gray-600 mt-2 text-center">
              Sua comunidade de fé na palma da mão
            </Text>
          </View>

          {/* Erro geral */}
          {errors.general && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-700 text-sm text-center">
                {errors.general}
              </Text>
            </View>
          )}

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
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-700 mb-2">Senha</Text>
            <View
              className={`flex-row items-center bg-gray-50 rounded-lg border px-3 ${
                errors.password ? 'border-red-400' : 'border-gray-300'
              }`}
            >
              <Lock size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 py-3 px-3 text-base text-gray-900"
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: undefined }))
                  }
                }}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                className="p-1"
                accessibilityLabel={
                  showPassword ? 'Ocultar senha' : 'Mostrar senha'
                }
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

          {/* Botão Entrar */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isSubmitting}
            className={`py-4 rounded-lg items-center ${
              isSubmitting ? 'bg-red-400' : 'bg-red-600 active:bg-red-700'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-base font-bold text-white">Entrar</Text>
            )}
          </TouchableOpacity>

          {/* Link para registro */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-sm text-gray-600">
              Ainda não tem conta?{' '}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-sm font-bold text-red-600">
                  Criar Conta
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
