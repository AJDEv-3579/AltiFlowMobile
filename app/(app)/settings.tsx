import { useState } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { logout } from '../../lib/auth'
import { removePushTokenFromServer, registerForPushNotifications } from '../../lib/notifications'

function SettingRow({ emoji, label, value, onPress, danger }: {
  emoji: string; label: string; value?: string; onPress?: () => void; danger?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
        <Text style={{ color: danger ? '#ef4444' : '#e4e4e7', fontSize: 15 }}>{label}</Text>
      </View>
      {value && <Text style={{ color: '#71717a', fontSize: 14 }}>{value}</Text>}
      {onPress && <Text style={{ color: danger ? '#ef4444' : '#71717a', fontSize: 16 }}>›</Text>}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { user, logout: contextLogout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try {
            // Try to unregister push token
            const token = await registerForPushNotifications()
            if (token) await removePushTokenFromServer(token)
          } catch { /* ignore */ }
          await contextLogout()
          router.replace('/(auth)')
        },
      },
    ])
  }

  const roleColors: Record<string, string> = {
    'Super-Admin': '#ef4444',
    'Admin': '#f59e0b',
    'Client-Admin': '#818cf8',
    'Client-User': '#34d399',
  }
  const roleColor = roleColors[user?.role || ''] || '#71717a'

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: '#0f0f1a', borderBottomWidth: 1, borderBottomColor: '#2a2a3d',
      }}>
        <Text style={{ color: '#818cf8', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
          ✈ ALTIFLOW
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>Settings</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Profile card */}
        <View style={{ margin: 16 }}>
          <View style={{
            backgroundColor: '#13131f', borderRadius: 20, borderWidth: 1,
            borderColor: '#2a2a3d', padding: 20, alignItems: 'center',
          }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#6366f1',
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Text style={{ fontSize: 32 }}>✈</Text>
            </View>
            <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: '800' }}>
              {user?.username}
            </Text>
            <View style={{
              marginTop: 8, backgroundColor: `${roleColor}20`,
              borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4,
              borderWidth: 1, borderColor: `${roleColor}40`,
            }}>
              <Text style={{ color: roleColor, fontWeight: '700', fontSize: 13 }}>
                {user?.role}
              </Text>
            </View>
            {user?.client?.name && (
              <Text style={{ color: '#71717a', fontSize: 12, marginTop: 8 }}>
                🏢 {user.client.name}
              </Text>
            )}
          </View>
        </View>

        {/* Settings sections */}
        <View style={{ backgroundColor: '#13131f', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#2a2a3d', marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ color: '#71717a', fontSize: 11, fontWeight: '600', letterSpacing: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            ACCOUNT
          </Text>
          <SettingRow emoji="👤" label="Username" value={user?.username} />
          <SettingRow emoji="🎭" label="Role" value={user?.role} />
          {user?.client?.name && (
            <SettingRow emoji="🏢" label="Organization" value={user.client.name} />
          )}
        </View>

        <View style={{ backgroundColor: '#13131f', marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#2a2a3d', marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ color: '#71717a', fontSize: 11, fontWeight: '600', letterSpacing: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            APP INFO
          </Text>
          <SettingRow emoji="📱" label="App Version" value="1.0.0" />
          <SettingRow emoji="🔔" label="Push Notifications" value="Enabled" />
          <SettingRow emoji="🌐" label="API Connection" value="Active" />
        </View>

        {/* Sign out */}
        <View style={{ marginHorizontal: 16, marginBottom: 40 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut}
            style={{
              backgroundColor: '#1a0a0a', borderRadius: 16, borderWidth: 1,
              borderColor: '#3b1212', padding: 18, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8,
            }}
            activeOpacity={0.8}
          >
            {signingOut ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <Text style={{ fontSize: 18 }}>🚪</Text>
            )}
            <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 16 }}>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}
