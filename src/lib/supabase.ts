import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && /^https?:\/\//.test(SUPABASE_URL) &&
  SUPABASE_ANON_KEY && !SUPABASE_URL.includes('seu-projeto')
)

/**
 * Adapter customizado para persistir sessão de autenticação
 * Supabase + React Native usando AsyncStorage + SecureStore
 */
class SupabaseSessionAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key)
      return value
    } catch (error) {
      console.error(`Error retrieving ${key} from AsyncStorage:`, error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.error(`Error setting ${key} in AsyncStorage:`, error)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${key} from AsyncStorage:`, error)
    }
  }
}

export const supabase: SupabaseClientType<Database> = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: new SupabaseSessionAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
  : new Proxy({} as SupabaseClientType<Database>, {
      get() { throw new Error('Supabase ainda não configurado neste build.') },
    })

/**
 * Função helper para cache offline da Liturgia Diária
 */
export const cacheManager = {
  async cacheLiturgy(date: string, data: Database['public']['Tables']['daily_liturgy']['Row']) {
    try {
      const cacheKey = `liturgy_${date}`
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data))
    } catch (error) {
      console.error('Error caching liturgy:', error)
    }
  },

  async getCachedLiturgy(date: string): Promise<Database['public']['Tables']['daily_liturgy']['Row'] | null> {
    try {
      const cacheKey = `liturgy_${date}`
      const cached = await AsyncStorage.getItem(cacheKey)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Error retrieving cached liturgy:', error)
      return null
    }
  },

  async clearLiturgyCache(date: string) {
    try {
      const cacheKey = `liturgy_${date}`
      await AsyncStorage.removeItem(cacheKey)
    } catch (error) {
      console.error('Error clearing liturgy cache:', error)
    }
  },

  async cacheNewsPosts(data: Database['public']['Tables']['news_posts']['Row'][]) {
    try {
      await AsyncStorage.setItem('news_posts_cache', JSON.stringify(data))
    } catch (error) {
      console.error('Error caching news posts:', error)
    }
  },

  async getCachedNewsPosts(): Promise<Database['public']['Tables']['news_posts']['Row'][] | null> {
    try {
      const cached = await AsyncStorage.getItem('news_posts_cache')
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Error retrieving cached news posts:', error)
      return null
    }
  },
}

export type SupabaseClient = typeof supabase
