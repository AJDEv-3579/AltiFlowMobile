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
import { PermissionsAndroid, Platform } from 'react-native'

SplashScreen.preventAutoHideAsync()

async function requestRuntimePermissions() {
  if (Platform.OS !== 'android') return
  try {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]
    // Add POST_NOTIFICATIONS for Android 13+ (API 33+)
    if (Platform.Version >= 33 && (PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS) {
      permissions.push((PermissionsAndroid.PERMISSIONS as any).POST_NOTIFICATIONS)
    }
    const granted = await PermissionsAndroid.requestMultiple(permissions)
    console.log('[Permissions] Status:', granted)
  } catch (err) {
    console.warn('[Permissions] Request failed:', err)
  }
}

function RootLayoutNav() {
  const { user, loading } = useAuth()
  const notifListener = useRef<any>(null)

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync()
    }
  }, [loading])

  useEffect(() => {
    requestRuntimePermissions()
  }, [])

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
