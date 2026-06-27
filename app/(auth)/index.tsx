import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../../context/AuthContext'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()

  async function handleLogin() {
    if (!username.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your username and password.')
      return
    }
    setLoading(true)
    try {
      await login(username.trim(), password)
      // Navigation handled by auth layout redirect
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <StatusBar style="light" />
      {/* Background gradient circles */}
      <View style={{
        position: 'absolute', top: -100, left: -80, width: 350, height: 350,
        borderRadius: 175, backgroundColor: '#6366f115', opacity: 0.6,
      }} />
      <View style={{
        position: 'absolute', bottom: 0, right: -80, width: 280, height: 280,
        borderRadius: 140, backgroundColor: '#4f46e510',
      }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Branding */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {/* Plane icon as text */}
              <Text style={{ fontSize: 32, marginRight: 6 }}>✈</Text>
              <Text style={{
                fontSize: 36, fontWeight: '800', letterSpacing: -1,
                color: '#ffffff',
              }}>
                Alti<Text style={{ color: '#818cf8' }}>Flow</Text>
              </Text>
            </View>
            <Text style={{ color: '#71717a', fontSize: 14, letterSpacing: 0.5 }}>
              Field Operations Platform
            </Text>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: '#13131f',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#2a2a3d',
            padding: 28,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 24,
            elevation: 12,
          }}>
            <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 6 }}>
              Sign In
            </Text>
            <Text style={{ color: '#71717a', fontSize: 13, marginBottom: 28 }}>
              Access your AltiFlow workspace
            </Text>

            {/* Username */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#a1a1aa', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                Username
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#3f3f46"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={{
                  backgroundColor: '#0f0f1a',
                  borderWidth: 1,
                  borderColor: '#2a2a3d',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#ffffff',
                  fontSize: 15,
                }}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 28 }}>
              <Text style={{ color: '#a1a1aa', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#3f3f46"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={{
                    backgroundColor: '#0f0f1a',
                    borderWidth: 1,
                    borderColor: '#2a2a3d',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    paddingRight: 52,
                    color: '#ffffff',
                    fontSize: 15,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: 14 }}
                >
                  <Text style={{ color: '#71717a', fontSize: 13 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#4338ca80' : '#6366f1',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              activeOpacity={0.8}
            >
              {loading && <ActivityIndicator color="#fff" size="small" />}
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#3f3f46', fontSize: 12, textAlign: 'center', marginTop: 32 }}>
            AltiFlow Mobile v1.0 • Secure Access
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
