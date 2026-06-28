import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { isInternal, isClientAdmin } from '../../lib/auth'
import { colors, STATUS_COLORS } from '../../lib/design'
import type { Job } from '../../lib/types'
import { ClipboardList, ChevronDown, ChevronUp, User, Calendar, Layers } from 'lucide-react-native'

const STAGES = ['Pending', 'In Progress', 'Done', 'Blocked']

function StagePicker({
  label, current, onSelect, disabled,
}: { label: string; current: string; onSelect: (s: string) => void; disabled: boolean }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {STAGES.map((s) => {
            const active = current === s
            const sc = STATUS_COLORS[s] || { bg: colors.border, text: colors.textMuted, border: colors.border }
            return (
              <TouchableOpacity
                key={s}
                onPress={() => onSelect(s)}
                disabled={disabled || active}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10,
                  backgroundColor: active ? sc.bg : colors.borderMuted,
                  borderWidth: 1, borderColor: active ? sc.border : colors.border,
                }}
              >
                <Text style={{ color: active ? sc.text : colors.textFaint, fontSize: 12, fontWeight: active ? '700' : '500' }}>
                  {s}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

function AssignedJobCard({ job, canUpdate }: { job: Job; canUpdate: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  async function updateStatus(field: 'sc_status' | 'uni_status', newStage: string) {
    setUpdating(true)
    try {
      await api(`/client-projects/${job.project_id}/jobs/${job.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: newStage }),
      })
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setUpdating(false)
    }
  }

  const hasSc = job.sc_status && job.sc_status !== 'Yet to Upload'
  const hasUni = job.uni_status && job.uni_status !== 'Yet to Upload'

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: 'hidden' }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14 }}>{job.title}</Text>
            <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 4 }}>
              {job.project_name || 'Unknown Project'}
              {job.client_name ? ` · ${job.client_name}` : ''}
            </Text>
          </View>
          {expanded ? <ChevronUp size={18} color={colors.textDim} /> : <ChevronDown size={18} color={colors.textDim} />}
        </View>

        {/* Status chips */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {job.category && (
            <View style={{ backgroundColor: colors.purpleMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.purple + '30' }}>
              <Text style={{ color: colors.purpleText, fontSize: 10, fontWeight: '600' }}>{job.category}</Text>
            </View>
          )}
          {hasSc && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textDim, fontSize: 10 }}>SC:</Text>
              <View style={{ backgroundColor: (STATUS_COLORS[job.sc_status!] || STATUS_COLORS['Pending']).bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: (STATUS_COLORS[job.sc_status!] || STATUS_COLORS['Pending']).text, fontSize: 10, fontWeight: '600' }}>{job.sc_status}</Text>
              </View>
            </View>
          )}
          {hasUni && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textDim, fontSize: 10 }}>Uni:</Text>
              <View style={{ backgroundColor: (STATUS_COLORS[job.uni_status!] || STATUS_COLORS['Pending']).bg, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: (STATUS_COLORS[job.uni_status!] || STATUS_COLORS['Pending']).text, fontSize: 10, fontWeight: '600' }}>{job.uni_status}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 14, marginBottom: 14 }}>
            {job.capture_date && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} color={colors.textFaint} />
                <Text style={{ color: colors.textFaint, fontSize: 12 }}>
                  {new Date(job.capture_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            )}
            {job.drone_name && (
              <Text style={{ color: colors.textFaint, fontSize: 12 }}>✈ {job.drone_name}</Text>
            )}
          </View>

          {canUpdate && hasSc && (
            <StagePicker label="Stand Count" current={job.sc_status!} onSelect={(s) => updateStatus('sc_status', s)} disabled={updating} />
          )}
          {canUpdate && hasUni && (
            <StagePicker label="Uniformity" current={job.uni_status!} onSelect={(s) => updateStatus('uni_status', s)} disabled={updating} />
          )}

          {/* Comments */}
          {(job.comments_log || []).length > 0 && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.borderMuted, paddingTop: 12, marginTop: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 8 }}>Recent Activity</Text>
              {job.comments_log!.slice(0, 3).map((c) => (
                <View key={c.id} style={{ marginBottom: 8 }}>
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>{c.username} · {c.stage}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{c.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default function AssignedScreen() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const canUpdate = isInternal(user?.role)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await api<{ jobs: Job[] }>('/jobs-assigned?limit=60&refresh=1')
      setJobs(data.jobs || [])
    } catch (e) {
      console.warn('[Assigned] Failed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  useFocusEffect(useCallback(() => { load(true) }, []))

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>AltiFlow</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 }}>My Jobs</Text>
        <Text style={{ color: colors.textFaint, fontSize: 13 }}>{jobs.length} assigned to you</Text>
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
          {jobs.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <ClipboardList size={52} color={colors.border} />
              <Text style={{ color: colors.textFaint, marginTop: 14, fontSize: 15 }}>No jobs assigned to you</Text>
            </View>
          ) : (
            jobs.map((job) => <AssignedJobCard key={job.id} job={job} canUpdate={canUpdate} />)
          )}
        </ScrollView>
      )}
    </View>
  )
}
