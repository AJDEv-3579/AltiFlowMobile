import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { isInternal } from '../../lib/auth'
import { colors, STATUS_COLORS } from '../../lib/design'
import type { ClientProject } from '../../lib/types'
import { Search, ChevronRight, FolderOpen, Calendar, User } from 'lucide-react-native'

function StatusBadge({ status }: { status: string }) {
  const sc = STATUS_COLORS[status] || { bg: colors.border, text: colors.textMuted, border: colors.border }
  return (
    <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: sc.border }}>
      <Text style={{ color: sc.text, fontSize: 11, fontWeight: '600' }}>{status}</Text>
    </View>
  )
}

function ProjectCard({ project, onPress }: { project: ClientProject; onPress: () => void }) {
  const startDate = project.start_date
    ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const endDate = project.end_date
    ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Ongoing'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: colors.card, borderRadius: 16, borderWidth: 1,
        borderColor: colors.border, padding: 16, marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 6 }} numberOfLines={2}>
            {project.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <View style={{ backgroundColor: colors.primaryMuted, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.primary + '30' }}>
              <Text style={{ color: colors.primaryText, fontSize: 11, fontWeight: '600' }}>{project.type}</Text>
            </View>
            {project.client_name && (
              <Text style={{ color: colors.textFaint, fontSize: 12 }}>{project.client_name}</Text>
            )}
          </View>
        </View>
        <ChevronRight size={18} color={colors.textDim} />
      </View>

      <View style={{ flexDirection: 'row', gap: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderMuted }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Calendar size={11} color={colors.textFaint} />
          <Text style={{ color: colors.textFaint, fontSize: 11 }}>{startDate}</Text>
        </View>
        <Text style={{ color: colors.textDim, fontSize: 11 }}>→</Text>
        <Text style={{ color: colors.textFaint, fontSize: 11 }}>{endDate}</Text>
        {project.head && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <User size={11} color={colors.textFaint} />
            <Text style={{ color: colors.textFaint, fontSize: 11 }} numberOfLines={1}>{project.head}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function ProjectsScreen() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await api<{ projects: ClientProject[] }>('/client-projects?limit=100')
      setProjects(data.projects || [])
    } catch (e) {
      console.warn('[Projects] Failed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  useFocusEffect(useCallback(() => { load(true) }, []))

  const q = search.toLowerCase()
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q) ||
      (p.client_name || '').toLowerCase().includes(q) ||
      (p.head || '').toLowerCase().includes(q)
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>AltiFlow</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 }}>Projects</Text>
        <Text style={{ color: colors.textFaint, fontSize: 13 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.borderMuted }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
          <Search size={16} color={colors.textFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects…"
            placeholderTextColor={colors.textDim}
            style={{ flex: 1, color: colors.textPrimary, paddingVertical: 10, fontSize: 14, marginLeft: 8 }}
          />
        </View>
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
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <FolderOpen size={52} color={colors.border} />
              <Text style={{ color: colors.textFaint, marginTop: 14, fontSize: 15 }}>
                {search ? 'No projects match your search' : 'No projects found'}
              </Text>
            </View>
          ) : (
            filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onPress={() => router.push(`/(app)/jobs/${p.id}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}
