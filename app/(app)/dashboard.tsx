import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, ScrollView, RefreshControl, ActivityIndicator,
  Animated, Easing,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { isInternal } from '../../lib/auth'
import { colors, ROLE_COLORS, STATUS_COLORS } from '../../lib/design'
import type { DashboardStats } from '../../lib/types'
import {
  BarChart2, Users, FolderOpen, Camera,
  ShieldAlert, TrendingUp, Clock, CheckCircle2,
} from 'lucide-react-native'

/* ── Skeleton loader ── */
function Skeleton({ width, height = 14, radius = 6 }: { width: number | string; height?: number; radius?: number }) {
  const anim = new Animated.Value(0.4)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start()
  }, [])
  return (
    <Animated.View
      style={{ width: width as any, height, borderRadius: radius, backgroundColor: colors.border, opacity: anim, marginBottom: 6 }}
    />
  )
}

/* ── Stat card ── */
function StatCard({
  Icon, label, value, color, delay = 0,
}: { Icon: any; label: string; value: number; color: string; delay?: number }) {
  const fade = new Animated.Value(0)
  const slide = new Animated.Value(16)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start()
  }, [])
  return (
    <Animated.View style={{
      opacity: fade, transform: [{ translateY: slide }],
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, padding: 16,
      flex: 1, marginBottom: 10,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ backgroundColor: color + '20', borderRadius: 10, padding: 8 }}>
          <Icon size={18} color={color} strokeWidth={2} />
        </View>
      </View>
      <Text style={{ color, fontSize: 30, fontWeight: '800', letterSpacing: -1 }}>{value}</Text>
      <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 3, fontWeight: '500' }}>{label}</Text>
    </Animated.View>
  )
}

/* ── SLA progress bar ── */
function SlaBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const width = new Animated.Value(0)
  useEffect(() => {
    Animated.timing(width, { toValue: pct, duration: 800, delay: 300, useNativeDriver: false, easing: Easing.out(Easing.cubic) }).start()
  }, [pct])
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
          {value} <Text style={{ color: colors.textDim, fontWeight: '400' }}>/ {total}</Text>
        </Text>
      </View>
      <View style={{ height: 7, backgroundColor: colors.borderMuted, borderRadius: 4 }}>
        <Animated.View
          style={{
            height: 7,
            width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  )
}

/* ── Client dashboard (simple project summary) ── */
function ClientDashboard({ user }: { user: any }) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ projects: any[] }>('/client-projects?limit=100')
      .then((d) => setProjects(d.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active = projects.filter((p) => !['Delivery', 'Done'].includes(p.status || '')).length
  const delivered = projects.filter((p) => p.status === 'Delivery' || p.status === 'Done').length

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
      {/* Welcome */}
      <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>Welcome back,</Text>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{user.username}</Text>
        {(() => {
          const rc = ROLE_COLORS[user.role] || { color: colors.textMuted, bg: colors.border, border: colors.border }
          return (
            <View style={{ marginTop: 10, alignSelf: 'flex-start', backgroundColor: rc.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: rc.border }}>
              <Text style={{ color: rc.color, fontWeight: '700', fontSize: 12 }}>{user.role}</Text>
            </View>
          )
        })()}
      </View>

      {/* Project summary */}
      {loading ? (
        <><Skeleton width="100%" height={80} radius={16} /><Skeleton width="100%" height={80} radius={16} /></>
      ) : (
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          <View style={{ flex: 1 }}>
            <StatCard Icon={FolderOpen} label="Total Projects" value={projects.length} color={colors.primary} delay={0} />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard Icon={TrendingUp} label="Active" value={active} color={colors.warning} delay={100} />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard Icon={CheckCircle2} label="Delivered" value={delivered} color={colors.success} delay={200} />
          </View>
        </View>
      )}

      <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, marginTop: 6 }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 12 }}>Your Projects</Text>
        {loading ? (
          <><Skeleton width="60%" /><Skeleton width="80%" /><Skeleton width="50%" /></>
        ) : projects.slice(0, 5).map((p) => {
          const sc = STATUS_COLORS[p.status] || STATUS_COLORS['Open']
          return (
            <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderMuted }}>
              <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, marginRight: 8 }} numberOfLines={1}>{p.name}</Text>
              <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: sc.border }}>
                <Text style={{ color: sc.text, fontSize: 10, fontWeight: '600' }}>{p.status || 'Active'}</Text>
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

/* ── Admin dashboard (full analytics) ── */
function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const data = await api<DashboardStats>('/analytics')
      setStats(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const slaTotal = stats?.bySla ? (stats.bySla.ok + stats.bySla.warning + stats.bySla.breached) : 0

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          {[0, 1].map((i) => <Skeleton key={i} width="47%" height={110} radius={16} />)}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          {[0, 1].map((i) => <Skeleton key={i} width="47%" height={110} radius={16} />)}
        </View>
        <Skeleton width="100%" height={180} radius={16} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <ShieldAlert size={40} color={colors.danger} />
        <Text style={{ color: colors.dangerText, marginTop: 12, textAlign: 'center' }}>{error}</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      {/* Stats grid */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <StatCard Icon={Camera} label="Field Jobs" value={stats?.totals?.field_jobs ?? 0} color={colors.primary} delay={0} />
        </View>
        <View style={{ flex: 1 }}>
          <StatCard Icon={FolderOpen} label="Projects" value={stats?.totals?.projects ?? 0} color={colors.success} delay={80} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <StatCard Icon={BarChart2} label="Clients" value={stats?.totals?.clients ?? 0} color={colors.warning} delay={160} />
        </View>
        <View style={{ flex: 1 }}>
          <StatCard Icon={Users} label="Users" value={stats?.totals?.users ?? 0} color={colors.purple} delay={240} />
        </View>
      </View>

      {/* SLA Health */}
      {stats?.bySla && (
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={16} color={colors.primary} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>SLA Health</Text>
          </View>
          <SlaBar label="On Track" value={stats.bySla.ok} total={slaTotal} color={colors.success} />
          <SlaBar label="Warning" value={stats.bySla.warning} total={slaTotal} color={colors.warning} />
          <SlaBar label="Breached" value={stats.bySla.breached} total={slaTotal} color={colors.danger} />
        </View>
      )}

      {/* Status Breakdown */}
      {stats?.byStatus && Object.keys(stats.byStatus).length > 0 && (
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FolderOpen size={16} color={colors.warning} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Project Status</Text>
          </View>
          {Object.entries(stats.byStatus).map(([status, count]) => {
            const sc = STATUS_COLORS[status] || { bg: colors.border, text: colors.textMuted, border: colors.border }
            return (
              <View key={status} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: sc.border }}>
                  <Text style={{ color: sc.text, fontSize: 12, fontWeight: '600' }}>{status}</Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>{count as number}</Text>
              </View>
            )
          })}
        </View>
      )}

      {/* Monthly bar chart */}
      {stats?.fieldJobsByMonth && stats.fieldJobsByMonth.length > 0 && (
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color={colors.success} />
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15 }}>Monthly Field Jobs</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 90, paddingBottom: 4 }}>
              {stats.fieldJobsByMonth.map((m) => {
                const maxCount = Math.max(...stats.fieldJobsByMonth.map((x) => x.count), 1)
                const h = Math.max(10, (m.count / maxCount) * 70)
                return (
                  <View key={m.key} style={{ alignItems: 'center', width: 44 }}>
                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginBottom: 4 }}>{m.count}</Text>
                    <View style={{ width: 36, height: h, backgroundColor: colors.primary, borderRadius: 8, opacity: 0.85 }} />
                    <Text style={{ color: colors.textFaint, fontSize: 9, marginTop: 5 }}>{m.label}</Text>
                  </View>
                )
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  )
}

/* ── Main screen ── */
export default function DashboardScreen() {
  const { user } = useAuth()
  const isAdmin = isInternal(user?.role)

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          AltiFlow
        </Text>
        <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 }}>Dashboard</Text>
        <Text style={{ color: colors.textFaint, fontSize: 13, marginTop: 1 }}>{user?.username} · {user?.role}</Text>
      </View>

      {isAdmin ? <AdminDashboard /> : <ClientDashboard user={user} />}
    </View>
  )
}
