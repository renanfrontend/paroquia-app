import { View, Text, TouchableOpacity } from 'react-native'
import { Link, Stack } from 'expo-router'
import { MapPinOff } from 'lucide-react-native'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Página não encontrada', headerShown: true }} />
      <View className="flex-1 justify-center items-center bg-white p-6">
        <View className="bg-gray-100 p-5 rounded-full mb-4">
          <MapPinOff size={40} color="#6b7280" />
        </View>
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Página não encontrada
        </Text>
        <Text className="text-sm text-gray-600 text-center mb-6">
          O conteúdo que você procura não existe ou foi movido.
        </Text>

        <Link href="/(tabs)" asChild>
          <TouchableOpacity className="px-6 py-3 bg-red-600 rounded-lg active:bg-red-700">
            <Text className="text-white font-bold">Voltar ao Início</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  )
}
