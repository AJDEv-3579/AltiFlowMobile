import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { api } from './api'

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications only work on physical devices.')
    return null
  }

  // Create default channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AltiFlow Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    })
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted.')
    return null
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'altiflow-mobile',
    })
    return tokenData.data
  } catch (e) {
    console.warn('[Notifications] Could not get push token:', e)
    return null
  }
}

export async function savePushTokenToServer(token: string, deviceName: string): Promise<void> {
  try {
    await api('/push-tokens', {
      method: 'POST',
      body: JSON.stringify({ token, device_name: deviceName }),
    })
  } catch (e) {
    console.warn('[Notifications] Failed to save push token:', e)
  }
}

export async function removePushTokenFromServer(token: string): Promise<void> {
  try {
    await api(`/push-tokens/${encodeURIComponent(token)}`, { method: 'DELETE' })
  } catch {
    // ignore errors on logout
  }
}

export function addNotificationListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler)
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler)
}

export function removeNotificationSubscription(
  subscription: Notifications.EventSubscription
) {
  Notifications.removeNotificationSubscription(subscription)
}
