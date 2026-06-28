import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { logout, changePassword } from '../../lib/auth'
import { removePushTokenFromServer, registerForPushNotifications } from '../../lib/notifications'
import { colors, ROLE_COLORS } from '../../lib/design'
import {
  User, Shield, Building2, Smartphone, Bell, Globe,
  Lock, LogOut, ChevronRight, Key,
} from 'lucide-react-native'

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
  Icon, label, value, onPress, danger,
}: { Icon: any; label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.borderMuted }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ backgroundColor: danger ? colors.dangerMuted : colors.borderMuted, borderRadius: 8, padding: 8 }}>
          <Icon size={16} color={danger ? colors.danger : colors.textMuted} />
        </View>
        <Text style={{ color: danger ? colors.dangerText : colors.textSecondary, fontSize: 15 }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value && <Text style={{ color: colors.textFaint, fontSize: 13 }}>{value}</Text>}
        {onPress && <ChevronRight size={16} color={danger ? colors.danger : colors.textDim} />}
      </View>
    </TouchableOpacity>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)

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
        <TextInput value={current} onChangeText={setCurrent} secureTextEntry placeholder="Current password" placeholderTextColor={colors.textDim} style={inputStyle} />
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>New Password</Text>
        <TextInput value={next} onChangeText={setNext} secureTextEntry placeholder="New password (min 8 chars)" placeholderTextColor={colors.textDim} style={inputStyle} />
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

export default function SettingsScreen() {
  const { user, logout: contextLogout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const [showChangePass, setShowChangePass] = useState(false)

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
              <User size={34} color={rc.color} />
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
          <Row Icon={User} label="Username" value={user?.username} />
          <Row Icon={Shield} label="Role" value={user?.role} />
          {user?.client?.name && <Row Icon={Building2} label="Organization" value={user.client.name} />}
          <Row Icon={Key} label="Change Password" onPress={() => setShowChangePass(true)} />
        </Section>

        <Section title="App Info">
          <Row Icon={Smartphone} label="App Version" value="1.0.0" />
          <Row Icon={Bell} label="Push Notifications" value="Enabled" />
          <Row Icon={Globe} label="API Connection" value="Active" />
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
              <LogOut size={20} color={colors.danger} />
            )}
            <Text style={{ color: colors.dangerText, fontWeight: '700', fontSize: 16 }}>
              {signingOut ? 'Signing out…' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showChangePass && <ChangePasswordModal onClose={() => setShowChangePass(false)} />}
    </View>
  )
}
