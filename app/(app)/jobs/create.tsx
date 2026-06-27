import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { api } from '../../../lib/api'

const CATEGORIES = ['Stand Count', 'Uniformity']

export default function CreateJobScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>()

  const [title, setTitle] = useState('')
  const [captureDate, setCaptureDate] = useState(() => new Date().toISOString().split('T')[0])
  const [droneName, setDroneName] = useState('')
  const [category, setCategory] = useState<'Stand Count' | 'Uniformity'>('Stand Count')
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
      Alert.alert('Success', 'Job card created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create job card.')
    } finally {
      setSaving(false)
    }
  }

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <View style={{ marginBottom: 18 }}>
        <Text style={{ color: '#a1a1aa', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' }}>
          {label}
        </Text>
        {children}
      </View>
    )
  }

  const inputStyle = {
    backgroundColor: '#0f0f1a', borderWidth: 1, borderColor: '#2a2a3d',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#ffffff' as const, fontSize: 14,
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        backgroundColor: '#0f0f14', borderBottomWidth: 1, borderBottomColor: '#222228',
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#3b82f6', fontSize: 20 }}>✕</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fafafa', fontSize: 20, fontWeight: '800' }}>New Job Card</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

          <Field label="Field / Title *">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. North Field Block A"
              placeholderTextColor="#3f3f46"
              style={inputStyle}
            />
          </Field>

          <Field label="Drone Name *">
            <TextInput
              value={droneName}
              onChangeText={setDroneName}
              placeholder="e.g. DJI Phantom 4"
              placeholderTextColor="#3f3f46"
              style={inputStyle}
            />
          </Field>

          <Field label="Capture Date *">
            <TextInput
              value={captureDate}
              onChangeText={setCaptureDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#3f3f46"
              style={inputStyle}
              keyboardType="numeric"
            />
          </Field>

          <Field label="Category *">
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c as any)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                    backgroundColor: category === c ? '#1e1e24' : '#0f0f14',
                    borderWidth: 1,
                    borderColor: category === c ? '#3b82f6' : '#222228',
                  }}
                >
                  <Text style={{ color: category === c ? '#3b82f6' : '#71717a', fontWeight: '600', fontSize: 13 }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Number of Flights *">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity
                onPress={() => setFlightCount(Math.max(1, flightCount - 1))}
                style={{
                  width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e1e24',
                  borderWidth: 1, borderColor: '#222228', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 20 }}>−</Text>
              </TouchableOpacity>
              <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', minWidth: 32, textAlign: 'center' }}>
                {flightCount}
              </Text>
              <TouchableOpacity
                onPress={() => setFlightCount(flightCount + 1)}
                style={{
                  width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e1e24',
                  borderWidth: 1, borderColor: '#222228', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 20 }}>+</Text>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label="Total Image Count *">
            <TextInput
              value={imageCount}
              onChangeText={setImageCount}
              placeholder="e.g. 1200"
              placeholderTextColor="#3f3f46"
              keyboardType="numeric"
              style={inputStyle}
            />
          </Field>

          <Field label="Has Logs">
            <TouchableOpacity
              onPress={() => setHasLogs(!hasLogs)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: hasLogs ? '#10b98120' : '#0f0f14',
                borderWidth: 1, borderColor: hasLogs ? '#10b98140' : '#222228',
                borderRadius: 12, padding: 14,
              }}
            >
              <Text style={{ color: '#a1a1aa', fontSize: 14 }}>Flight logs available</Text>
              <View style={{
                width: 44, height: 24, borderRadius: 12,
                backgroundColor: hasLogs ? '#10b981' : '#222228',
                padding: 2,
              }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff',
                  marginLeft: hasLogs ? 20 : 0,
                }} />
              </View>
            </TouchableOpacity>
          </Field>

          <Field label="Comments (optional)">
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder="Add notes or remarks…"
              placeholderTextColor="#3f3f46"
              multiline
              numberOfLines={3}
              style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
            />
          </Field>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            style={{
              backgroundColor: saving ? '#3b82f680' : '#3b82f6',
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8,
            }}
            activeOpacity={0.8}
          >
            {saving && <ActivityIndicator color="#fff" size="small" />}
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
              {saving ? 'Creating…' : 'Create Job Card'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
