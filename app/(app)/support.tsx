import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { isInternal } from '../../lib/auth'
import { colors, STATUS_COLORS } from '../../lib/design'
import { Ionicons } from '@expo/vector-icons'

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: string
  priority?: string
  client_name?: string
  created_by_name?: string
  created_at: string
  updated_at: string
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Low':      { bg: '#0c1a0c', text: '#86efac', border: '#4ade8030' },
  'Medium':   { bg: colors.warningMuted, text: colors.warningText, border: colors.warning + '30' },
  'High':     { bg: colors.dangerMuted, text: colors.dangerText, border: colors.danger + '30' },
  'Critical': { bg: '#3b0000', text: '#fca5a5', border: '#ef444430' },
}

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const [expanded, setExpanded] = useState(false)
  const sc = STATUS_COLORS[ticket.status] || { bg: colors.border, text: colors.textMuted, border: colors.border }
  const pc = ticket.priority ? (PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS['Medium']) : null
  const date = new Date(ticket.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 10 }} numberOfLines={2}>
            {ticket.subject}
          </Text>
          {expanded ? <Ionicons name="chevron-up" size={18} color={colors.textDim} /> : <Ionicons name="chevron-down" size={18} color={colors.textDim} />}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: sc.border }}>
            <Text style={{ color: sc.text, fontSize: 11, fontWeight: '600' }}>{ticket.status}</Text>
          </View>
          {pc && (
            <View style={{ backgroundColor: pc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: pc.border }}>
              <Text style={{ color: pc.text, fontSize: 11, fontWeight: '600' }}>{ticket.priority}</Text>
            </View>
          )}
          <Text style={{ color: colors.textDim, fontSize: 11 }}>{date}</Text>
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{ticket.description}</Text>
          {ticket.client_name && (
            <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 8 }}>🏢 {ticket.client_name}</Text>
          )}
          {ticket.created_by_name && (
            <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 4 }}>👤 {ticket.created_by_name}</Text>
          )}
        </View>
      )}
    </View>
  )
}

function NewTicketModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!subject.trim()) return Alert.alert('Missing', 'Subject is required.')
    if (!description.trim()) return Alert.alert('Missing', 'Description is required.')
    setSaving(true)
    try {
      await api('/support-tickets', {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), priority }),
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit ticket.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    backgroundColor: colors.borderMuted, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.textPrimary, fontSize: 14,
  }

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 100 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 24, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 20 }}>New Support Ticket</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Subject</Text>
          <TextInput value={subject} onChangeText={setSubject} placeholder="Describe the issue briefly…" placeholderTextColor={colors.textDim} style={{ ...inputStyle, marginBottom: 16 }} />

          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Priority</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {['Low', 'Medium', 'High', 'Critical'].map((p) => {
              const active = priority === p
              const pc = PRIORITY_COLORS[p]
              return (
                <TouchableOpacity key={p} onPress={() => setPriority(p)} style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: active ? pc.bg : colors.borderMuted, borderWidth: 1, borderColor: active ? pc.border : colors.border }}>
                  <Text style={{ color: active ? pc.text : colors.textFaint, fontSize: 12, fontWeight: '600' }}>{p}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Full details of the issue…" placeholderTextColor={colors.textDim} multiline numberOfLines={4} style={{ ...inputStyle, minHeight: 100, textAlignVertical: 'top', marginBottom: 20 }} />

          <TouchableOpacity onPress={handleSubmit} disabled={saving} activeOpacity={0.8} style={{ backgroundColor: saving ? colors.primary + '80' : colors.primary, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send-outline" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{saving ? 'Submitting…' : 'Submit Ticket'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

export default function SupportScreen() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNew, setShowNew] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await api<{ tickets: SupportTicket[] }>('/support-tickets?limit=80')
      setTickets(data.tickets || [])
    } catch (e) {
      console.warn('[Support] Failed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  useFocusEffect(useCallback(() => { load(true) }, []))

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>AltiFlow</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 }}>Support</Text>
          <Text style={{ color: colors.textFaint, fontSize: 13 }}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowNew(true)}
          style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {tickets.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Ionicons name="ticket-outline" size={52} color={colors.border} />
              <Text style={{ color: colors.textFaint, marginTop: 14, fontSize: 15 }}>No support tickets yet</Text>
              <TouchableOpacity onPress={() => setShowNew(true)} style={{ marginTop: 20, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Create First Ticket</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tickets.map((t) => <TicketCard key={t.id} ticket={t} />)
          )}
        </ScrollView>
      )}

      {showNew && (
        <NewTicketModal onClose={() => setShowNew(false)} onSuccess={() => load(true)} />
      )}
    </View>
  )
}
