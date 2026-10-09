import '../styles/global.css'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { ActivityIndicator, View, Text } from 'react-native'

/**
 * RootLayout: Gerencia autenticação global, navegação e providers
 */
export default function RootLayout() {
  if (!isSupabaseConfigured) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fef2f2' }}>
        <Text style={{ fontSize: 30, fontWeight: '700', color: '#991b1b', textAlign: 'center' }}>Paróquia Conectada</Text>
        <Text style={{ fontSize: 18, marginTop: 20, textAlign: 'center', color: '#374151' }}>Estamos preparando nossa comunidade digital.</Text>
        <Text style={{ fontSize: 15, lineHeight: 24, marginTop: 12, maxWidth: 440, textAlign: 'center', color: '#4b5563' }}>O aplicativo foi instalado, mas a conexão com os serviços da paróquia ainda não foi configurada. Login, notícias e pedidos de oração estarão disponíveis após essa etapa.</Text>
      </View>
    )
  }
  return <ConfiguredLayout />
}

function ConfiguredLayout() {
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
    }).catch(() => { setSession(null); setIsLoading(false) })

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
  }, [isLoading, session, segments, router])

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

      {isLoading && (
        <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      )}
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  )
}
