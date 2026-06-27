import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
  TextInput,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { ClientProject } from '../../lib/types'
import { isClient } from '../../lib/auth'

function ProjectCard({ project, onPress }: { project: ClientProject; onPress: () => void }) {
  const startDate = project.start_date
    ? new Date(project.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const endDate = project.end_date
    ? new Date(project.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Ongoing'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: '#13131f', borderRadius: 16, borderWidth: 1,
        borderColor: '#2a2a3d', padding: 18, marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
            {project.name}
          </Text>
          <View style={{
            backgroundColor: '#1a1a2e', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
            alignSelf: 'flex-start', marginBottom: 8,
          }}>
            <Text style={{ color: '#818cf8', fontSize: 11, fontWeight: '600' }}>{project.type}</Text>
          </View>
          {project.client_name && (
            <Text style={{ color: '#71717a', fontSize: 12 }}>🏢 {project.client_name}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: '#34d399', fontSize: 18 }}>›</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, borderTopWidth: 1, borderTopColor: '#2a2a3d', paddingTop: 10 }}>
        <Text style={{ color: '#71717a', fontSize: 11 }}>📅 {startDate}</Text>
        <Text style={{ color: '#71717a', fontSize: 11 }}>→ {endDate}</Text>
        <Text style={{ color: '#71717a', fontSize: 11 }}>👤 {project.head}</Text>
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

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q) ||
      (p.head || '').toLowerCase().includes(q)
    )
  })

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        backgroundColor: '#0f0f1a', borderBottomWidth: 1, borderBottomColor: '#2a2a3d',
      }}>
        <Text style={{ color: '#818cf8', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
          ✈ ALTIFLOW
        </Text>
        <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
          Projects
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0f0f1a' }}>
        <View style={{
          backgroundColor: '#13131f', borderRadius: 12, borderWidth: 1,
          borderColor: '#2a2a3d', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
        }}>
          <Text style={{ color: '#71717a', marginRight: 8, fontSize: 16 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects…"
            placeholderTextColor="#3f3f46"
            style={{ flex: 1, color: '#ffffff', paddingVertical: 10, fontSize: 14 }}
          />
        </View>
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
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 64 }}>
              <Text style={{ fontSize: 48 }}>📁</Text>
              <Text style={{ color: '#71717a', marginTop: 12, fontSize: 15 }}>
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
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  )
}
