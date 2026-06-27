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
    <View style={{ flex: 1, backgroundColor: '#f0f4f8' }}>
      <StatusBar style="dark" />
      
      {/* Background gradients for a modern look */}
      <View style={{
        position: 'absolute', top: -150, left: -50, width: 400, height: 400,
        borderRadius: 200, backgroundColor: '#e0e7ff', opacity: 0.8,
      }} />
      <View style={{
        position: 'absolute', bottom: -100, right: -100, width: 350, height: 350,
        borderRadius: 175, backgroundColor: '#dbeafe', opacity: 0.9,
      }} />
      <View style={{
        position: 'absolute', top: '30%', right: -50, width: 150, height: 150,
        borderRadius: 75, backgroundColor: '#ede9fe', opacity: 0.7,
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
              <Text style={{
                fontSize: 42, fontWeight: '800', letterSpacing: -1,
                color: '#1e1b4b',
              }}>
                Alti<Text style={{ color: '#6366f1' }}>Flow</Text>
              </Text>
            </View>
            <Text style={{ color: '#4f46e5', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 }}>
              Field Operations Platform
            </Text>
          </View>

          {/* Glassmorphism Card */}
          <View style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderRadius: 24,
            padding: 32,
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.1,
            shadowRadius: 32,
            elevation: 8,
          }}>
            <Text style={{ color: '#1e1b4b', fontSize: 24, fontWeight: '700', marginBottom: 8 }}>
              Welcome back
            </Text>
            <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
              Please sign in to your account
            </Text>

            {/* Username */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                Username
              </Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  color: '#0f172a',
                  fontSize: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 4,
                }}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' }}>
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    paddingRight: 52,
                    color: '#0f172a',
                    fontSize: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.02,
                    shadowRadius: 4,
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: 14, padding: 4 }}
                >
                  <Text style={{ color: '#6366f1', fontSize: 14, fontWeight: '600' }}>
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
                backgroundColor: loading ? '#818cf8' : '#4f46e5',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#4f46e5',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.9}
            >
              {loading && <ActivityIndicator color="#fff" size="small" />}
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 40, fontWeight: '500' }}>
            AltiFlow Mobile v1.0 • Secure Access
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
