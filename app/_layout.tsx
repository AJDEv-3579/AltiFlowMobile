import '../global.css'
import { useEffect, useRef } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import * as Device from 'expo-device'
import { AuthProvider, useAuth } from '../context/AuthContext'
import {
  registerForPushNotifications,
  savePushTokenToServer,
  addNotificationResponseListener,
  removeNotificationSubscription,
} from '../lib/notifications'
import type * as Notifications from 'expo-notifications'

SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  const { user, loading } = useAuth()
  const notifListener = useRef<any>(null)

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync()
    }
  }, [loading])

  useEffect(() => {
    if (!user) return

    // Register push notifications for Admin/Super-Admin
    if (['Admin', 'Super-Admin'].includes(user.role)) {
      registerForPushNotifications().then((token) => {
        if (token) {
          savePushTokenToServer(token, Device.deviceName || 'Android Device')
        }
      })
    }

    // Handle tapping a notification → navigate to jobs
    notifListener.current = addNotificationResponseListener(
      (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data as any
        if (data?.projectId) {
          router.push(`/(app)/jobs/${data.projectId}`)
        } else if (data?.screen) {
          router.push(data.screen)
        }
      }
    )

    return () => {
      if (notifListener.current) {
        removeNotificationSubscription(notifListener.current)
      }
    }
  }, [user])

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}
