import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { ActivityIndicator, View } from 'react-native'

/**
 * RootLayout: Gerencia autenticação global, navegação e providers
 */
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    /**
     * Recuperar sessão inicial + listener para mudanças
     */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  /**
   * Redireciona para login se não autenticado
   */
  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isLoading, session, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f9fafb' },
        }}
      >
        <Stack.Screen name="(auth)" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen
          name="modals/novo-pedido-oracao"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="modals/pix-qr-modal"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>

      <StatusBar style="dark" />
    </GestureHandlerRootView>
  )
}
