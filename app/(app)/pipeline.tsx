import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { colors, STATUS_COLORS } from '../../lib/design'
import { Briefcase, ChevronRight, User, Calendar, RotateCcw } from 'lucide-react-native'

// Field project type (from /projects endpoint)
interface FieldProject {
  id: string
  title: string
  client_id: string
  status: string
  drone_name?: string
  capture_date?: string
  image_count?: number
  assignee_name?: string
  created_at: string
  sla_deadline?: string
}

function PipelineCard({ project }: { project: FieldProject }) {
  const sc = STATUS_COLORS[project.status] || { bg: colors.border, text: colors.textMuted, border: colors.border }
  const captureDate = project.capture_date
    ? new Date(project.capture_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : null

  const slaLeft = project.sla_deadline
    ? new Date(project.sla_deadline).getTime() - Date.now()
    : null
  const slaHours = slaLeft !== null ? Math.floor(slaLeft / 3600000) : null
  const slaColor = slaHours === null ? null
    : slaHours < 0 ? colors.danger
    : slaHours < 4 ? colors.warning
    : colors.success

  return (
    <View style={{
      backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
      borderColor: colors.border, padding: 16, marginBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, flex: 1, marginRight: 10 }} numberOfLines={2}>
          {project.title}
        </Text>
        <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: sc.border }}>
          <Text style={{ color: sc.text, fontSize: 11, fontWeight: '600' }}>{project.status}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {captureDate && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} color={colors.textFaint} />
            <Text style={{ color: colors.textFaint, fontSize: 12 }}>{captureDate}</Text>
          </View>
        )}
        {project.drone_name && (
          <Text style={{ color: colors.textFaint, fontSize: 12 }}>✈ {project.drone_name}</Text>
        )}
        {project.image_count && (
          <Text style={{ color: colors.textFaint, fontSize: 12 }}>📸 {project.image_count} imgs</Text>
        )}
        {project.assignee_name && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <User size={12} color={colors.textFaint} />
            <Text style={{ color: colors.textFaint, fontSize: 12 }}>{project.assignee_name}</Text>
          </View>
        )}
      </View>

      {slaColor && slaHours !== null && (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderMuted }}>
          <Text style={{ color: slaColor, fontSize: 11, fontWeight: '600' }}>
            {slaHours < 0 ? `SLA Breached ${Math.abs(slaHours)}h ago` : `SLA: ${slaHours}h remaining`}
          </Text>
        </View>
      )}
    </View>
  )
}

export default function PipelineScreen() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<FieldProject[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await api<{ projects: FieldProject[] }>('/projects?limit=100')
      setProjects(data.projects || [])
    } catch (e) {
      console.warn('[Pipeline] Failed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  useFocusEffect(useCallback(() => { load(true) }, []))

  const statuses = ['all', 'Open', 'In Progress', 'Failed_Refly', 'Done', 'Delivery']
  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter)

  const counts: Record<string, number> = { all: projects.length }
  for (const p of projects) counts[p.status] = (counts[p.status] || 0) + 1

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>AltiFlow</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 }}>Pipeline</Text>
        <Text style={{ color: colors.textFaint, fontSize: 13 }}>Field project tracker</Text>
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.borderMuted, maxHeight: 54 }}
      >
        {statuses.map((s) => {
          const active = filter === s
          const sc = s !== 'all' ? (STATUS_COLORS[s] || { bg: colors.border, text: colors.textMuted, border: colors.border }) : null
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setFilter(s)}
              style={{
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
                backgroundColor: active ? (sc?.bg || colors.primaryMuted) : colors.card,
                borderWidth: 1,
                borderColor: active ? (sc?.border || colors.primary + '40') : colors.border,
              }}
            >
              <Text style={{ color: active ? (sc?.text || colors.primaryText) : colors.textFaint, fontSize: 12, fontWeight: active ? '700' : '500' }}>
                {s === 'all' ? `All (${counts.all || 0})` : `${s} (${counts[s] || 0})`}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

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
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Briefcase size={52} color={colors.border} />
              <Text style={{ color: colors.textFaint, marginTop: 14, fontSize: 15 }}>No projects in this stage</Text>
            </View>
          ) : (
            filtered.map((p) => <PipelineCard key={p.id} project={p} />)
          )}
        </ScrollView>
      )}
    </View>
  )
}
