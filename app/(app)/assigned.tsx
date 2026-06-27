import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { Job } from '../../lib/types'
import { router } from 'expo-router'

const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Pending': { bg: '#1e3a5f', text: '#60a5fa' },
  'In Progress': { bg: '#1a3a2a', text: '#34d399' },
  'Done': { bg: '#14532d', text: '#86efac' },
  'Blocked': { bg: '#3b1212', text: '#fca5a5' },
  'Cancelled': { bg: '#3b1212', text: '#fca5a5' },
}

function StageBadge({ stage }: { stage: string }) {
  const c = STAGE_COLORS[stage] || { bg: '#1a1a2e', text: '#a1a1aa' }
  return (
    <View style={{ backgroundColor: c.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: c.text, fontSize: 11, fontWeight: '600' }}>{stage}</Text>
    </View>
  )
}

function AssignedJobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const STAGES = ['Pending', 'In Progress', 'Done', 'Blocked']

  async function updateStatus(field: 'sc_status' | 'uni_status', newStage: string) {
    setUpdating(true)
    try {
      await api(`/client-projects/${job.project_id}/jobs/${job.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: newStage }),
      })
      Alert.alert('Updated', `Stage changed to ${newStage}`)
    } catch (e: any) {
      Alert.alert('Error', e.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <View style={{
      backgroundColor: '#13131f', borderRadius: 16, borderWidth: 1,
      borderColor: '#2a2a3d', marginBottom: 12, overflow: 'hidden',
    }}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8} style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>{job.title}</Text>
            <Text style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>
              {job.project_name || 'Unknown Project'}
              {job.client_name ? ` • ${job.client_name}` : ''}
            </Text>
          </View>
          <Text style={{ color: '#71717a', fontSize: 16 }}>{expanded ? '▲' : '▼'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {job.category && (
            <View style={{ backgroundColor: '#312e81', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#a5b4fc', fontSize: 10, fontWeight: '600' }}>{job.category}</Text>
            </View>
          )}
          {job.sc_status && job.sc_status !== 'Yet to Upload' && <StageBadge stage={job.sc_status} />}
          {job.uni_status && job.uni_status !== 'Yet to Upload' && <StageBadge stage={job.uni_status} />}
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#2a2a3d', padding: 16 }}>
          {job.sc_status && job.sc_status !== 'Yet to Upload' && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 8, fontWeight: '600' }}>Stand Count Stage</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {STAGES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => updateStatus('sc_status', s)}
                      disabled={updating}
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
              <Text style={{ color: '#a1a1aa', fontSize: 11, marginBottom: 8, fontWeight: '600' }}>Uniformity Stage</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {STAGES.map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => updateStatus('uni_status', s)}
                      disabled={updating}
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
          {(job.comments_log || []).slice(0, 3).map((c) => (
            <View key={c.id} style={{ marginBottom: 6 }}>
              <Text style={{ color: '#818cf8', fontSize: 11 }}>{c.username} • {c.stage}</Text>
              <Text style={{ color: '#e4e4e7', fontSize: 12, marginTop: 2 }}>{c.comment}</Text>
            </View>
          ))}
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      <View style={{
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        backgroundColor: '#0f0f1a', borderBottomWidth: 1, borderBottomColor: '#2a2a3d',
      }}>
        <Text style={{ color: '#818cf8', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>✈ ALTIFLOW</Text>
        <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>My Jobs</Text>
        <Text style={{ color: '#71717a', fontSize: 13 }}>Jobs assigned to you</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#818cf8" size="large" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#818cf8" />}
        >
          {jobs.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 64 }}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={{ color: '#71717a', marginTop: 12 }}>No jobs assigned to you</Text>
            </View>
          ) : (
            jobs.map((job) => <AssignedJobCard key={job.id} job={job} />)
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  )
}
