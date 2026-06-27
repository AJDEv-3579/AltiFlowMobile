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

// SplashScreen.preventAutoHideAsync()

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
  console.log('[RootLayoutNav] Render');
  const auth = useAuth()
  const user = auth?.user
  const loading = auth?.loading
  const notifListener = useRef<any>(null)

  useEffect(() => {
    console.log('[RootLayoutNav] loading status:', loading);
    if (!loading) {
      SplashScreen.hideAsync().catch((err) => console.warn('Splash hide error:', err))
    }
  }, [loading])

  useEffect(() => {
    console.log('[RootLayoutNav] App started');
    requestRuntimePermissions()
  }, [])

  useEffect(() => {
    console.log('[RootLayoutNav] Auth effect:', { loading, user: user?.username });
    if (loading) return

    if (!user) {
      console.log('[RootLayoutNav] Redirect to (auth)');
      router.replace('/(auth)')
    } else {
      console.log('[RootLayoutNav] Redirect to (app)');
      router.replace('/(app)/dashboard')
    }
  }, [user, loading])

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
