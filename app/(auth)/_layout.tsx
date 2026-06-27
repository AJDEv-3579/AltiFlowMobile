import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { router } from 'expo-router'

export default function AuthLayout() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(app)/dashboard')
    }
  }, [user, loading])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
