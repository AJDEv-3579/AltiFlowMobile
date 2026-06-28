import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { logout, changePassword, changeUsername } from '../../lib/auth'
import { removePushTokenFromServer, registerForPushNotifications } from '../../lib/notifications'
import { colors, ROLE_COLORS } from '../../lib/design'
import { Ionicons } from '@expo/vector-icons'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4 }}>
        {title}
      </Text>
      <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  )
}

function Row({
  icon, label, value, onPress, danger,
}: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.borderMuted }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ backgroundColor: danger ? colors.dangerMuted : colors.borderMuted, borderRadius: 8, padding: 8 }}>
          <Ionicons name={icon as any} size={16} color={danger ? colors.danger : colors.textMuted} />
        </View>
        <Text style={{ color: danger ? colors.dangerText : colors.textSecondary, fontSize: 15 }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value && <Text style={{ color: colors.textFaint, fontSize: 13 }}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={16} color={danger ? colors.danger : colors.textDim} />}
      </View>
    </TouchableOpacity>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)

  async function handleChange() {
    if (!current || !next) return Alert.alert('Missing', 'Please fill in both fields.')
    if (next.length < 8) return Alert.alert('Too Short', 'New password must be at least 8 characters.')
    setSaving(true)
    try {
      await changePassword(current, next)
      Alert.alert('Success', 'Password changed successfully!', [{ text: 'OK', onPress: onClose }])
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    backgroundColor: colors.borderMuted, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 14, marginBottom: 12,
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 24 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 24, width: '100%' }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 20, marginBottom: 20 }}>Change Password</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Current Password</Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            value={current}
            onChangeText={setCurrent}
            secureTextEntry={!showCurrent}
            placeholder="Current password"
            placeholderTextColor={colors.textDim}
            style={[inputStyle, { paddingRight: 48 }]}
          />
          <TouchableOpacity
            onPress={() => setShowCurrent(!showCurrent)}
            style={{ position: 'absolute', right: 12, top: 10, padding: 4 }}
          >
            <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>New Password</Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            value={next}
            onChangeText={setNext}
            secureTextEntry={!showNext}
            placeholder="New password (min 8 chars)"
            placeholderTextColor={colors.textDim}
            style={[inputStyle, { paddingRight: 48 }]}
          />
          <TouchableOpacity
            onPress={() => setShowNext(!showNext)}
            style={{ position: 'absolute', right: 12, top: 10, padding: 4 }}
          >
            <Ionicons name={showNext ? "eye-off-outline" : "eye-outline"} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <TouchableOpacity onPress={onClose} style={{ flex: 1, backgroundColor: colors.borderMuted, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChange} disabled={saving} style={{ flex: 2, backgroundColor: saving ? colors.primary + '80' : colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {saving && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving…' : 'Change Password'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

function ChangeUsernameModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const { user } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!username.trim()) return Alert.alert('Error', 'Please enter a username.')
    const trimmed = username.trim()
    if (trimmed.length < 3) return Alert.alert('Too Short', 'Username must be at least 3 characters.')
    if (trimmed.includes('@')) return Alert.alert('Invalid', 'Username cannot be an email address.')
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return Alert.alert('Invalid', 'Username can only contain letters, numbers, and underscores.')
    }

    setSaving(true)
    try {
      await changeUsername(trimmed)
      Alert.alert('Success', 'Username updated successfully!', [{ text: 'OK', onPress: () => { onSave(); onClose(); } }])
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update username. It might be already taken.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    backgroundColor: colors.borderMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 24 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 24, width: '100%' }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 20, marginBottom: 20 }}>Edit Username</Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={colors.textDim}
          style={inputStyle}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <TouchableOpacity onPress={onClose} style={{ flex: 1, backgroundColor: colors.borderMuted, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving || username.trim() === user?.username} style={{ flex: 2, backgroundColor: saving ? colors.primary + '80' : colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            {saving && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function SettingsScreen() {
  const { user, logout: contextLogout, refresh: contextRefresh } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [showChangePass, setShowChangePass] = useState(false)
  const [showChangeUsername, setShowChangeUsername] = useState(false)

  const rc = ROLE_COLORS[user?.role || ''] || { color: colors.textMuted, bg: colors.border, border: colors.border }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try {
            const token = await registerForPushNotifications()
            if (token) await removePushTokenFromServer(token)
          } catch { /* ignore */ }
          await contextLogout()
          router.replace('/(auth)')
        },
      },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>AltiFlow</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 }}>Settings</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}>
        {/* Profile card */}
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center' }}>
            <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: rc.bg, borderWidth: 2, borderColor: rc.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Ionicons name="person-outline" size={34} color={rc.color} />
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>{user?.username}</Text>
            <View style={{ marginTop: 8, backgroundColor: rc.bg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: rc.border }}>
              <Text style={{ color: rc.color, fontWeight: '700', fontSize: 13 }}>{user?.role}</Text>
            </View>
            {user?.client?.name && (
              <Text style={{ color: colors.textFaint, fontSize: 13, marginTop: 8 }}>🏢 {user.client.name}</Text>
            )}
          </View>
        </View>

        <Section title="Account">
          <Row icon="person-outline" label="Username" value={user?.username} onPress={() => setShowChangeUsername(true)} />
          <Row icon="shield-outline" label="Role" value={user?.role} />
          {user?.client?.name && <Row icon="business-outline" label="Organization" value={user.client.name} />}
          <Row icon="key-outline" label="Change Password" onPress={() => setShowChangePass(true)} />
        </Section>

        <Section title="App Info">
          <Row icon="phone-portrait-outline" label="App Version" value="1.0.0" />
          <Row icon="notifications-outline" label="Push Notifications" value="Enabled" />
          <Row icon="globe-outline" label="API Connection" value="Active" />
        </Section>

        <View style={{ marginHorizontal: 16, marginBottom: 40 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.8}
            style={{ backgroundColor: colors.dangerMuted, borderRadius: 16, borderWidth: 1, borderColor: colors.danger + '30', padding: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
          >
            {signingOut ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            )}
            <Text style={{ color: colors.dangerText, fontWeight: '700', fontSize: 16 }}>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
      {showChangeUsername && <ChangeUsernameModal onClose={() => setShowChangeUsername(false)} onSave={contextRefresh} />}
    </View>
  )
}
