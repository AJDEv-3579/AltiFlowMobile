import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { DashboardStats } from '../../lib/types'
import { isInternal } from '../../lib/auth'
import { LinearGradient } from 'expo-linear-gradient' // Ensure we use nice gradients!

const STAT_CARDS = [
  { key: 'field_jobs', label: 'Field Jobs', emoji: '📸', color: '#3b82f6' }, // primary
  { key: 'projects', label: 'Projects', emoji: '📁', color: '#10b981' }, // success
  { key: 'clients', label: 'Clients', emoji: '🏢', color: '#f59e0b' }, // warning
  { key: 'users', label: 'Users', emoji: '👥', color: '#6366f1' },
]

function StatCard({ emoji, label, value, color }: {
  emoji: string; label: string; value: number; color: string
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#0f0f14', borderRadius: 16,
      borderWidth: 1, borderColor: '#222228', padding: 16,
      marginBottom: 12,
    }}>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>{emoji}</Text>
      <Text style={{ color: color, fontSize: 28, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#a1a1aa', fontSize: 12, marginTop: 2, fontWeight: '500' }}>{label}</Text>
    </View>
  )
}

function SlaBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: '#a1a1aa', fontSize: 12 }}>{label}</Text>
        <Text style={{ color: '#fafafa', fontSize: 12, fontWeight: '600' }}>{value}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: '#1e1e24', borderRadius: 3 }}>
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
  const [error, setError] = useState('')

  const adminView = user && isInternal(user.role)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      // Internal users see /analytics, clients might just not have a dashboard API for now.
      if (adminView) {
        const data = await api<DashboardStats>('/analytics')
        setStats(data)
      } else {
        // Fallback for clients: we could fetch their own projects/jobs here
        // For now, let's keep it simple or empty
      }
    } catch (e: any) {
      console.warn('[Dashboard] Failed:', e)
      setError(e.message || 'Failed to load dashboard data')
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

  const slaTotal = stats?.bySla ? (stats.bySla.ok + stats.bySla.warning + stats.bySla.breached) : 0

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Header */}
      <View style={{
        paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
        backgroundColor: '#0f0f14', borderBottomWidth: 1, borderBottomColor: '#222228',
      }}>
        <Text style={{ color: '#3b82f6', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
          ✈ ALTIFLOW
        </Text>
        <Text style={{ color: '#fafafa', fontSize: 24, fontWeight: '800', marginTop: 2 }}>
          Dashboard
        </Text>
        <Text style={{ color: '#a1a1aa', fontSize: 13, marginTop: 2 }}>
          {user?.role} • {user?.username}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color="#3b82f6" size="large" />
          <Text style={{ color: '#a1a1aa', marginTop: 12 }}>Loading stats…</Text>
        </View>
      ) : !adminView ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#a1a1aa', textAlign: 'center' }}>
            Welcome to AltiFlow! Check your assigned projects and jobs from the Projects tab.
          </Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#dc2626', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#3b82f6" />}
        >
          {/* Stats grid */}
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
            {STAT_CARDS.map((s) => (
              <View key={s.key} style={{ width: '47%' }}>
                <StatCard
                  emoji={s.emoji}
                  label={s.label}
                  value={stats?.totals?.[s.key as keyof typeof stats.totals] ?? 0}
                  color={s.color}
                />
              </View>
            ))}
          </View>

          {/* SLA Health */}
          {stats?.bySla && (
            <View style={{
              backgroundColor: '#0f0f14', borderRadius: 16, borderWidth: 1,
              borderColor: '#222228', padding: 20, marginBottom: 16,
            }}>
              <Text style={{ color: '#fafafa', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>
                SLA Health
              </Text>
              <SlaBar label="On Track" value={stats.bySla.ok} total={slaTotal} color="#10b981" />
              <SlaBar label="Warning" value={stats.bySla.warning} total={slaTotal} color="#f59e0b" />
              <SlaBar label="Breached" value={stats.bySla.breached} total={slaTotal} color="#dc2626" />
            </View>
          )}

          {/* Status Breakdown */}
          {stats?.byStatus && Object.keys(stats.byStatus).length > 0 && (
            <View style={{
              backgroundColor: '#0f0f14', borderRadius: 16, borderWidth: 1,
              borderColor: '#222228', padding: 20, marginBottom: 16,
            }}>
              <Text style={{ color: '#fafafa', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>
                Project Status
              </Text>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <View key={status} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ color: '#a1a1aa', fontSize: 13 }}>{status}</Text>
                  <View style={{
                    backgroundColor: '#1e1e24', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2,
                  }}>
                    <Text style={{ color: '#3b82f6', fontWeight: '700', fontSize: 13 }}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Monthly trend */}
          {stats?.fieldJobsByMonth && stats.fieldJobsByMonth.length > 0 && (
            <View style={{
              backgroundColor: '#0f0f14', borderRadius: 16, borderWidth: 1,
              borderColor: '#222228', padding: 20, marginBottom: 32,
            }}>
              <Text style={{ color: '#fafafa', fontWeight: '700', fontSize: 16, marginBottom: 16 }}>
                Monthly Field Jobs
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 }}>
                  {stats.fieldJobsByMonth.map((m) => {
                    const maxCount = Math.max(...stats.fieldJobsByMonth.map((x) => x.count), 1)
                    const h = Math.max(8, (m.count / maxCount) * 60)
                    return (
                      <View key={m.key} style={{ alignItems: 'center', width: 42 }}>
                        <Text style={{ color: '#3b82f6', fontSize: 10, fontWeight: '700', marginBottom: 4 }}>
                          {m.count}
                        </Text>
                        <View style={{
                          width: 32, height: h, backgroundColor: '#3b82f6',
                          borderRadius: 6, opacity: 0.8,
                        }} />
                        <Text style={{ color: '#a1a1aa', fontSize: 9, marginTop: 4 }}>{m.label}</Text>
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
