import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../../context/AuthContext'
import { api } from '../../../lib/api'
import type { Job, JobComment } from '../../../lib/types'
import { isClient, isClientAdmin } from '../../../lib/auth'

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Pending':        { bg: '#1e3a5f', text: '#60a5fa' },
  'In Progress':    { bg: '#1a3a2a', text: '#34d399' },
  'Done':           { bg: '#14532d', text: '#86efac' },
  'Blocked':        { bg: '#3b1212', text: '#fca5a5' },
  'Cancelled':      { bg: '#3b1212', text: '#fca5a5' },
  'Yet to Upload':  { bg: '#1a1a2e', text: '#71717a' },
}

function StageBadge({ stage }: { stage: string }) {
  const c = STAGE_COLORS[stage] || { bg: '#1a1a2e', text: '#a1a1aa' }
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: c.text, fontSize: 11, fontWeight: '600' }}>{stage}</Text>
    </View>
  )
}

function JobCard({ job, onRefresh, canDelete }: { job: Job; onRefresh: () => void; canDelete: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const captureDate = job.capture_date
    ? new Date(job.capture_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
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

  const STAGES = ['Pending', 'In Progress', 'Done', 'Blocked']

  return (
    <View style={{
      backgroundColor: '#13131f', borderRadius: 16, borderWidth: 1,
      borderColor: '#2a2a3d', marginBottom: 12, overflow: 'hidden',
    }}>
      {/* Card header */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
        style={{ padding: 16 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>{job.title}</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {job.category && (
                <View style={{ backgroundColor: '#312e81', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#a5b4fc', fontSize: 10, fontWeight: '600' }}>{job.category}</Text>
                </View>
              )}
              {captureDate && (
                <Text style={{ color: '#71717a', fontSize: 11 }}>📅 {captureDate}</Text>
              )}
              {job.drone_name && (
                <Text style={{ color: '#71717a', fontSize: 11 }}>✈ {job.drone_name}</Text>
              )}
            </View>
          </View>
          <Text style={{ color: '#71717a', fontSize: 18 }}>{expanded ? '▲' : '▼'}</Text>
        </View>

        {/* Status row */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {job.sc_status !== 'Yet to Upload' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#71717a', fontSize: 10 }}>SC:</Text>
              <StageBadge stage={job.sc_status || 'Pending'} />
            </View>
          )}
          {job.uni_status !== 'Yet to Upload' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#71717a', fontSize: 10 }}>Uni:</Text>
              <StageBadge stage={job.uni_status || 'Pending'} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded details */}
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#2a2a3d', padding: 16 }}>
          {/* Flight info */}
          {job.flight_count && (
            <Text style={{ color: '#a1a1aa', fontSize: 12, marginBottom: 8 }}>
              🛩 {job.flight_count} flight{job.flight_count > 1 ? 's' : ''}
              {job.flights && ` • ${job.flights.reduce((s, f) => s + (f.image_count || 0), 0)} images`}
            </Text>
          )}
          {job.has_logs && (
            <Text style={{ color: '#f59e0b', fontSize: 12, marginBottom: 8 }}>📋 Logs available</Text>
          )}
          {job.assigned_to_name && (
            <Text style={{ color: '#71717a', fontSize: 12, marginBottom: 12 }}>
              👤 Assigned to: <Text style={{ color: '#a1a1aa' }}>{job.assigned_to_name}</Text>
            </Text>
          )}

          {/* Stage controls for Admin roles */}
          {!isClient('' /* role check done outside */) && (
            <>
              {job.sc_status && job.sc_status !== 'Yet to Upload' && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 8, fontWeight: '600' }}>
                    Stand Count Stage
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {STAGES.map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => updateStatus('sc_status', s)}
                          disabled={updating || job.sc_status === s}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                            backgroundColor: job.sc_status === s ? '#4338ca' : '#1a1a2e',
                            borderWidth: 1, borderColor: job.sc_status === s ? '#6366f1' : '#2a2a3d',
                          }}
                        >
                          <Text style={{ color: job.sc_status === s ? '#c7d2fe' : '#71717a', fontSize: 12 }}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
              {job.uni_status && job.uni_status !== 'Yet to Upload' && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 8, fontWeight: '600' }}>
                    Uniformity Stage
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {STAGES.map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() => updateStatus('uni_status', s)}
                          disabled={updating || job.uni_status === s}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                            backgroundColor: job.uni_status === s ? '#4338ca' : '#1a1a2e',
                            borderWidth: 1, borderColor: job.uni_status === s ? '#6366f1' : '#2a2a3d',
                          }}
                        >
                          <Text style={{ color: job.uni_status === s ? '#c7d2fe' : '#71717a', fontSize: 12 }}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </>
          )}

          {/* Comments log */}
          {job.comments_log && job.comments_log.length > 0 && (
            <View style={{ borderTopWidth: 1, borderTopColor: '#2a2a3d', paddingTop: 12 }}>
              <Text style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 8, fontWeight: '600' }}>
                📝 Activity Log
              </Text>
              {job.comments_log.slice(0, 4).map((c) => (
                <View key={c.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: '#818cf8', fontSize: 11, fontWeight: '600' }}>{c.username}</Text>
                    <View style={{ backgroundColor: '#1a1a2e', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <Text style={{ color: '#71717a', fontSize: 9 }}>{c.stage}</Text>
                    </View>
                    <Text style={{ color: '#3f3f46', fontSize: 10 }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={{ color: '#e4e4e7', fontSize: 12, marginTop: 2 }}>{c.comment}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default function JobsScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [projectName, setProjectName] = useState('')

  const canCreate = isClient(user?.role)
  const canDelete = ['Super-Admin', 'Client-Admin'].includes(user?.role || '')

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

  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
      load(true)
    }, [projectId])
  )

  // Group jobs by day (matching web app)
  const groupedByDay = useMemo(() => {
    const groups: Record<string, Job[]> = {}
    for (const job of jobs) {
      const dateKey = new Date(job.created_at).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(job)
    }
    return Object.entries(groups).sort((a, b) =>
      new Date(b[1][0].created_at).getTime() - new Date(a[1][0].created_at).getTime()
    )
  }, [jobs])

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        backgroundColor: '#0f0f1a', borderBottomWidth: 1, borderBottomColor: '#2a2a3d',
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#818cf8', fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#818cf8', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
            JOB CARDS
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
            {projectName || `Project ${projectId?.slice(0, 8)}`}
          </Text>
        </View>
        {canCreate && (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/jobs/create?projectId=${projectId}`)}
            style={{
              backgroundColor: '#6366f1', borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>+ New</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#818cf8" size="large" />
        </View>
      ) : jobs.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={{ color: '#71717a', marginTop: 12, fontSize: 15 }}>No job cards yet</Text>
          {canCreate && (
            <TouchableOpacity
              onPress={() => router.push(`/(app)/jobs/create?projectId=${projectId}`)}
              style={{
                backgroundColor: '#6366f1', borderRadius: 12, marginTop: 20,
                paddingHorizontal: 24, paddingVertical: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Create First Job Card</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#818cf8" />}
        >
          {groupedByDay.map(([date, dayJobs]) => (
            <View key={date}>
              {/* Day header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4,
              }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#2a2a3d' }} />
                <View style={{
                  backgroundColor: '#1a1a2e', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10,
                }}>
                  <Text style={{ color: '#818cf8', fontSize: 11, fontWeight: '600' }}>
                    📅 {date} ({dayJobs.length})
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: '#2a2a3d' }} />
              </View>
              {dayJobs.map((job) => (
                <JobCard key={job.id} job={job} onRefresh={() => load(true)} canDelete={canDelete} />
              ))}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  )
}
