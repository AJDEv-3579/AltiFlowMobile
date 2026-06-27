import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { DashboardStats } from '../../lib/types'

const STAT_CARDS = [
  { key: 'field_jobs', label: 'Field Jobs', emoji: '📸', color: '#818cf8' },
  { key: 'projects', label: 'Projects', emoji: '📁', color: '#34d399' },
  { key: 'clients', label: 'Clients', emoji: '🏢', color: '#f59e0b' },
  { key: 'users', label: 'Users', emoji: '👥', color: '#60a5fa' },
]

function StatCard({ emoji, label, value, color }: {
  emoji: string; label: string; value: number; color: string
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#13131f', borderRadius: 16,
      borderWidth: 1, borderColor: '#2a2a3d', padding: 16,
      marginBottom: 12,
    }}>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</Text>
      <Text style={{ color: color, fontSize: 28, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function SlaBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: '#a1a1aa', fontSize: 12 }}>{label}</Text>
        <Text style={{ color: '#e4e4e7', fontSize: 12, fontWeight: '600' }}>{value}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: '#1a1a2e', borderRadius: 3 }}>
        <View style={{ height: 6, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  )
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const data = await api<DashboardStats>('/dashboard')
      setStats(data)
    } catch (e) {
      console.warn('[Dashboard] Failed:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  useFocusEffect(
    useCallback(() => {
      load(true)
    }, [])
  )

  const slaTotal = stats ? (stats.bySla.ok + stats.bySla.warning + stats.bySla.breached) : 0

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
          Dashboard
        </Text>
        <Text style={{ color: '#71717a', fontSize: 13, marginTop: 2 }}>
          {user?.role} • {user?.username}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#818cf8" size="large" />
          <Text style={{ color: '#71717a', marginTop: 12 }}>Loading stats…</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#818cf8" />}
        >
          {/* Stats grid */}
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
            {STAT_CARDS.map((s) => (
              <View key={s.key} style={{ width: '47%' }}>
                <StatCard
                  emoji={s.emoji}
                  label={s.label}
                  value={stats?.totals[s.key as keyof typeof stats.totals] ?? 0}
                  color={s.color}
                />
              </View>
            ))}
          </View>

          {/* SLA Health */}
          {stats && (
            <View style={{
              backgroundColor: '#13131f', borderRadius: 16, borderWidth: 1,
              borderColor: '#2a2a3d', padding: 20, marginBottom: 16,
            }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>
                SLA Health
              </Text>
              <SlaBar label="On Track" value={stats.bySla.ok} total={slaTotal} color="#34d399" />
              <SlaBar label="Warning" value={stats.bySla.warning} total={slaTotal} color="#f59e0b" />
              <SlaBar label="Breached" value={stats.bySla.breached} total={slaTotal} color="#ef4444" />
            </View>
          )}

          {/* Status Breakdown */}
          {stats && Object.keys(stats.byStatus).length > 0 && (
            <View style={{
              backgroundColor: '#13131f', borderRadius: 16, borderWidth: 1,
              borderColor: '#2a2a3d', padding: 20, marginBottom: 16,
            }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>
                Project Status
              </Text>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <View key={status} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ color: '#a1a1aa', fontSize: 13 }}>{status}</Text>
                  <View style={{
                    backgroundColor: '#1a1a2e', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2,
                  }}>
                    <Text style={{ color: '#818cf8', fontWeight: '700', fontSize: 13 }}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Monthly trend */}
          {stats?.fieldJobsByMonth && stats.fieldJobsByMonth.length > 0 && (
            <View style={{
              backgroundColor: '#13131f', borderRadius: 16, borderWidth: 1,
              borderColor: '#2a2a3d', padding: 20, marginBottom: 32,
            }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>
                Monthly Field Jobs
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 }}>
                  {stats.fieldJobsByMonth.map((m) => {
                    const maxCount = Math.max(...stats.fieldJobsByMonth.map((x) => x.count), 1)
                    const h = Math.max(8, (m.count / maxCount) * 60)
                    return (
                      <View key={m.key} style={{ alignItems: 'center', width: 42 }}>
                        <Text style={{ color: '#818cf8', fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                          {m.count}
                        </Text>
                        <View style={{
                          width: 32, height: h, backgroundColor: '#6366f1',
                          borderRadius: 6, opacity: 0.8,
                        }} />
                        <Text style={{ color: '#71717a', fontSize: 9, marginTop: 4 }}>{m.label}</Text>
                      </View>
                    )
                  })}
                </View>
              </ScrollView>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}
