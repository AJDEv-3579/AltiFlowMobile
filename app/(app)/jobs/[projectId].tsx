import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, Animated,
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../lib/api'
import type { Job } from '../../../lib/types'
import { isClient, isInternal, isClientAdmin } from '../../../lib/auth'
import { colors, STATUS_COLORS } from '../../../lib/design'
import {
  ArrowLeft, Plus, ChevronDown, ChevronUp,
  Calendar, Plane, Camera, User, ClipboardCheck,
  Activity, MessageSquare, Layers,
} from 'lucide-react-native'

// ─── Status badge ────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const sc = STATUS_COLORS[status] || { bg: colors.border, text: colors.textMuted, border: colors.border }
  return (
    <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: sc.border }}>
      <Text style={{ color: sc.text, fontSize: 11, fontWeight: '600' }}>{status}</Text>
    </View>
  )
}

// ─── Stage picker ─────────────────────────────────────────
const STAGES = ['Pending', 'In Progress', 'Done', 'Blocked']
function StagePicker({ label, current, onSelect, disabled }: {
  label: string; current: string; onSelect: (s: string) => void; disabled: boolean
}) {
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

// ─── Job card ────────────────────────────────────────────
function JobCard({ job, onRefresh, canEdit }: { job: Job; onRefresh: () => void; canEdit: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const captureDate = job.capture_date
    ? new Date(job.capture_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  async function updateStatus(field: 'sc_status' | 'uni_status', newStage: string) {
    setUpdating(true)
    try {
      await api(`/client-projects/${job.project_id}/jobs/${job.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: newStage }),
      })
      onRefresh()
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
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {job.category && (
                <View style={{ backgroundColor: colors.purpleMuted, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.purple + '30' }}>
                  <Text style={{ color: colors.purpleText, fontSize: 10, fontWeight: '600' }}>{job.category}</Text>
                </View>
              )}
              {captureDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Calendar size={11} color={colors.textFaint} />
                  <Text style={{ color: colors.textFaint, fontSize: 11 }}>{captureDate}</Text>
                </View>
              )}
              {job.drone_name && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Plane size={11} color={colors.textFaint} />
                  <Text style={{ color: colors.textFaint, fontSize: 11 }}>{job.drone_name}</Text>
                </View>
              )}
            </View>
          </View>
          {expanded ? <ChevronUp size={18} color={colors.textDim} /> : <ChevronDown size={18} color={colors.textDim} />}
        </View>

        {/* Status row */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {hasSc && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textDim, fontSize: 10 }}>SC</Text>
              <StatusBadge status={job.sc_status!} />
            </View>
          )}
          {hasUni && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textDim, fontSize: 10 }}>Uni</Text>
              <StatusBadge status={job.uni_status!} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, padding: 16 }}>
          {job.flight_count != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Plane size={14} color={colors.textFaint} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {job.flight_count} flight{job.flight_count > 1 ? 's' : ''}
                {job.flights ? ` · ${job.flights.reduce((s, f) => s + (f.image_count || 0), 0)} images` : ''}
              </Text>
            </View>
          )}
          {job.has_logs && (
            <Text style={{ color: colors.warning, fontSize: 13, marginBottom: 8 }}>📋 Logs available</Text>
          )}
          {job.assigned_to_name && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <User size={14} color={colors.textFaint} />
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Assigned to: <Text style={{ color: colors.textSecondary }}>{job.assigned_to_name}</Text></Text>
            </View>
          )}

          {canEdit && hasSc && (
            <StagePicker label="Stand Count Stage" current={job.sc_status!} onSelect={(s) => updateStatus('sc_status', s)} disabled={updating} />
          )}
          {canEdit && hasUni && (
            <StagePicker label="Uniformity Stage" current={job.uni_status!} onSelect={(s) => updateStatus('uni_status', s)} disabled={updating} />
          )}

          {(job.comments_log || []).length > 0 && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.borderMuted, paddingTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MessageSquare size={13} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>Activity</Text>
              </View>
              {job.comments_log!.slice(0, 4).map((c) => (
                <View key={c.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>{c.username}</Text>
                    <View style={{ backgroundColor: colors.borderMuted, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ color: colors.textDim, fontSize: 9 }}>{c.stage}</Text>
                    </View>
                    <Text style={{ color: colors.textDim, fontSize: 10 }}>
                      {new Date(c.created_at).toLocaleDateString('en-GB')}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 3 }}>{c.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Project Tracker tab ────────────────────────────────
const TRACKER_STAGES = [
  { key: 'Open', label: 'Submitted', icon: ClipboardCheck },
  { key: 'In Progress', label: 'Processing', icon: Activity },
  { key: 'Done', label: 'QC Done', icon: Layers },
  { key: 'Delivery', label: 'Delivered', icon: Camera },
]

function ProjectTracker({ jobs }: { jobs: Job[] }) {
  const doneCount = jobs.filter((j) => j.sc_status === 'Done' || j.uni_status === 'Done').length
  const inProgressCount = jobs.filter((j) => j.sc_status === 'In Progress' || j.uni_status === 'In Progress').length
  const totalCount = jobs.length

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      {/* Overall progress */}
      <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>Overall Progress</Text>
        <Text style={{ color: colors.textFaint, fontSize: 13, marginBottom: 16 }}>
          {doneCount} of {totalCount} job cards complete
        </Text>
        <View style={{ height: 10, backgroundColor: colors.borderMuted, borderRadius: 6 }}>
          <View style={{
            height: 10,
            width: totalCount > 0 ? `${Math.round((doneCount / totalCount) * 100)}%` : '0%',
            backgroundColor: colors.success,
            borderRadius: 6,
          }} />
        </View>
        <Text style={{ color: colors.success, fontWeight: '700', marginTop: 8 }}>
          {totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0}% Complete
        </Text>
      </View>

      {/* Stage counts */}
      <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 16, marginBottom: 14 }}>Job Card Status</Text>
        {(['Pending', 'In Progress', 'Done', 'Blocked', 'Yet to Upload'] as const).map((stage) => {
          const scCount = jobs.filter((j) => j.sc_status === stage).length
          const uniCount = jobs.filter((j) => j.uni_status === stage).length
          if (scCount === 0 && uniCount === 0) return null
          const sc = STATUS_COLORS[stage] || { bg: colors.border, text: colors.textMuted, border: colors.border }
          return (
            <View key={stage} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderMuted }}>
              <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: sc.border }}>
                <Text style={{ color: sc.text, fontSize: 12, fontWeight: '600' }}>{stage}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 14 }}>
                {scCount > 0 && <Text style={{ color: colors.textMuted, fontSize: 13 }}>SC: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{scCount}</Text></Text>}
                {uniCount > 0 && <Text style={{ color: colors.textMuted, fontSize: 13 }}>Uni: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{uniCount}</Text></Text>}
              </View>
            </View>
          )
        })}
      </View>

      {/* Timeline */}
      {jobs.slice(0, 10).map((job, idx) => (
        <View key={job.id} style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ alignItems: 'center', marginRight: 14 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: job.sc_status === 'Done' ? colors.success + '30' : colors.borderMuted,
              borderWidth: 2, borderColor: job.sc_status === 'Done' ? colors.success : colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={14} color={job.sc_status === 'Done' ? colors.success : colors.textDim} />
            </View>
            {idx < 9 && <View style={{ width: 2, flex: 1, backgroundColor: colors.borderMuted, marginTop: 4 }} />}
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{job.title}</Text>
            {job.capture_date && (
              <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 3 }}>
                {new Date(job.capture_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

// ─── Main screen ─────────────────────────────────────────
export default function JobsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'jobs' | 'tracker'>('jobs')

  // Client-Admin can create. Admin/Super-Admin can edit stages.
  const canCreate = isClientAdmin(user?.role) || isInternal(user?.role)
  const canEdit = isInternal(user?.role)

  async function load(isRefresh = false) {
    if (!projectId) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await api<{ jobs: Job[] }>(`/client-projects/${projectId}/jobs?limit=100&refresh=1`)
      setJobs(data.jobs || [])
    } catch (e) {
      console.warn('[Jobs] Failed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [projectId])
  useFocusEffect(useCallback(() => { load(true) }, [projectId]))

  const groupedByDay = useMemo(() => {
    const groups: Record<string, Job[]> = {}
    for (const job of jobs) {
      const dateKey = new Date(job.created_at).toLocaleDateString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(job)
    }
    return Object.entries(groups).sort(
      (a, b) => new Date(b[1][0].created_at).getTime() - new Date(a[1][0].created_at).getTime()
    )
  }, [jobs])

  const TABS = [
    { key: 'jobs' as const, label: 'Job Cards', Icon: ClipboardCheck },
    { key: 'tracker' as const, label: 'Project Tracker', Icon: Activity },
  ]

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingBottom: 0, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Job Cards</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
              {projectId ? `Project ${projectId.slice(0, 8)}…` : 'Project'}
            </Text>
          </View>
          {canCreate && (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/jobs/create?projectId=${projectId}`)}
              style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Plus size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab switcher */}
        <View style={{ flexDirection: 'row', gap: 0 }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 12,
                  borderBottomWidth: 2.5, borderBottomColor: active ? colors.primary : 'transparent',
                }}
              >
                <tab.Icon size={14} color={active ? colors.primary : colors.textFaint} />
                <Text style={{ color: active ? colors.primary : colors.textFaint, fontWeight: active ? '700' : '500', fontSize: 13 }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : activeTab === 'tracker' ? (
        <ProjectTracker jobs={jobs} />
      ) : jobs.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <ClipboardCheck size={52} color={colors.border} />
          <Text style={{ color: colors.textFaint, marginTop: 14, fontSize: 15 }}>No job cards yet</Text>
          {canCreate && (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/jobs/create?projectId=${projectId}`)}
              style={{ backgroundColor: colors.primary, borderRadius: 12, marginTop: 20, paddingHorizontal: 24, paddingVertical: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Create First Job Card</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
        >
          {groupedByDay.map(([date, dayJobs]) => (
            <View key={date}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <View style={{ backgroundColor: colors.borderMuted, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ color: colors.textDim, fontSize: 11, fontWeight: '600' }}>
                    {date} · {dayJobs.length}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>
              {dayJobs.map((job) => (
                <JobCard key={job.id} job={job} onRefresh={() => load(true)} canEdit={canEdit} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}
