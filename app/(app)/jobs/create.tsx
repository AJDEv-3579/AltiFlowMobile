import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { api } from '../../../lib/api'
import { colors } from '../../../lib/design'
import { Ionicons } from '@expo/vector-icons'

const CATEGORIES = ['Stand Count', 'Uniformity'] as const
type Category = typeof CATEGORIES[number]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
        {label}
      </Text>
      {children}
    </View>
  )
}

const inputStyle = {
  backgroundColor: colors.borderMuted,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  color: colors.textPrimary,
  fontSize: 14,
}

export default function CreateJobScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>()

  const [title, setTitle] = useState('')
  const [captureDate, setCaptureDate] = useState(() => new Date().toISOString().split('T')[0])
  const [droneName, setDroneName] = useState('')
  const [category, setCategory] = useState<Category>('Stand Count')
  const [flightCount, setFlightCount] = useState(1)
  const [imageCount, setImageCount] = useState('')
  const [hasLogs, setHasLogs] = useState(false)
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!title.trim()) return Alert.alert('Missing', 'Title is required.')
    if (!captureDate) return Alert.alert('Missing', 'Capture date is required.')
    if (!droneName.trim()) return Alert.alert('Missing', 'Drone name is required.')
    if (!imageCount || parseInt(imageCount) < 1) return Alert.alert('Missing', 'Image count must be at least 1.')

    setSaving(true)
    try {
      await api(`/client-projects/${projectId}/jobs`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          capture_date: captureDate,
          drone_name: droneName.trim(),
          category,
          flight_count: flightCount,
          flights: Array.from({ length: flightCount }, (_, i) => ({
            name: `Flight ${i + 1}`,
            image_count: i === 0 ? parseInt(imageCount) : 0,
          })),
          has_logs: hasLogs,
          comments: comments.trim() || null,
        }),
      })
      Alert.alert('✅ Success', 'Job card created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create job card.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20,
        backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="close" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>New Job Card</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>Create Job</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

          <Field label="Field / Title *">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. North Field Block A"
              placeholderTextColor={colors.textDim}
              style={inputStyle}
            />
          </Field>

          <Field label="Drone Name *">
            <TextInput
              value={droneName}
              onChangeText={setDroneName}
              placeholder="e.g. DJI Phantom 4"
              placeholderTextColor={colors.textDim}
              style={inputStyle}
            />
          </Field>

          <Field label="Capture Date *">
            <TextInput
              value={captureDate}
              onChangeText={setCaptureDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textDim}
              style={inputStyle}
              keyboardType="numeric"
            />
          </Field>

          <Field label="Category *">
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {CATEGORIES.map((c) => {
                const active = category === c
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    style={{
                      flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
                      backgroundColor: active ? colors.primaryMuted : colors.borderMuted,
                      borderWidth: 1.5, borderColor: active ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ color: active ? colors.primaryText : colors.textFaint, fontWeight: '700', fontSize: 13 }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </Field>

          <Field label="Number of Flights *">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
              <TouchableOpacity
                onPress={() => setFlightCount(Math.max(1, flightCount - 1))}
                style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.borderMuted, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 22, lineHeight: 24 }}>−</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '800', minWidth: 40, textAlign: 'center' }}>
                {flightCount}
              </Text>
              <TouchableOpacity
                onPress={() => setFlightCount(flightCount + 1)}
                style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary + '40', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.primaryText, fontSize: 22, lineHeight: 24 }}>+</Text>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Total Image Count *">
            <TextInput
              value={imageCount}
              onChangeText={setImageCount}
              placeholder="e.g. 1200"
              placeholderTextColor={colors.textDim}
              keyboardType="numeric"
              style={inputStyle}
            />
          </Field>

          <Field label="Flight Logs">
            <TouchableOpacity
              onPress={() => setHasLogs(!hasLogs)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: hasLogs ? colors.successMuted + '40' : colors.borderMuted,
                borderWidth: 1.5, borderColor: hasLogs ? colors.success + '40' : colors.border,
                borderRadius: 12, padding: 14,
              }}
            >
              <Text style={{ color: hasLogs ? colors.successText : colors.textMuted, fontSize: 14 }}>
                Flight logs available
              </Text>
              <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: hasLogs ? colors.success : colors.border, padding: 2 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', marginLeft: hasLogs ? 20 : 0 }} />
              </View>
            </TouchableOpacity>
          </Field>

          <Field label="Comments (optional)">
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder="Add notes or remarks…"
              placeholderTextColor={colors.textDim}
              multiline
              numberOfLines={3}
              style={{ ...inputStyle, minHeight: 90, textAlignVertical: 'top' }}
            />
          </Field>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.85}
            style={{
              backgroundColor: saving ? colors.primary + '70' : colors.primary,
              borderRadius: 16, paddingVertical: 17, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8,
            }}
          >
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
              {saving ? 'Creating…' : 'Create Job Card'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
