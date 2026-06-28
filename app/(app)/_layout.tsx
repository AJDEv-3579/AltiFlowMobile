import { useEffect } from 'react'
import { Tabs, router } from 'expo-router'
import { View, Text, Platform } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { isInternal } from '../../lib/auth'
import { BlurView } from 'expo-blur'
import {
  BarChart2, FolderOpen, ClipboardList, Briefcase,
  Settings, Users, Home, TicketCheck,
} from 'lucide-react-native'
import { colors } from '../../lib/design'

function TabIcon({
  Icon, label, focused,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
  label: string
  focused: boolean
}) {
  const col = focused ? colors.primary : colors.textFaint
  return (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
      <Icon size={22} color={col} strokeWidth={focused ? 2.2 : 1.8} />
      <Text
        style={{
          fontSize: 10,
          marginTop: 3,
          fontWeight: focused ? '700' : '500',
          color: col,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

const TAB_BAR_STYLE = {
  position: 'absolute' as const,
  backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.card,
  borderTopColor: 'rgba(255,255,255,0.06)',
  borderTopWidth: 1,
  height: Platform.OS === 'ios' ? 80 : 68,
  elevation: 0,
  paddingBottom: Platform.OS === 'ios' ? 20 : 6,
}

export default function AppLayout() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)')
    }
  }, [loading, user])

  if (loading || !user) return null

  const isAdmin = isInternal(user.role)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE,
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint="dark"
              intensity={85}
              style={{ flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.75)' }}
            />
          ) : null,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarShowLabel: false,
      }}
    >
      {/* ── Dashboard ── */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={BarChart2} label="Dashboard" focused={focused} />
          ),
        }}
      />

      {/* ── Pipeline (admin only) ── */}
      <Tabs.Screen
        name="pipeline"
        options={{
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Briefcase} label="Pipeline" focused={focused} />
          ),
        }}
      />

      {/* ── Projects / Workspaces ── */}
      <Tabs.Screen
        name="projects"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={FolderOpen} label="Projects" focused={focused} />
          ),
        }}
      />

      {/* ── Assigned Jobs (admin only) ── */}
      <Tabs.Screen
        name="assigned"
        options={{
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={ClipboardList} label="My Jobs" focused={focused} />
          ),
        }}
      />

      {/* ── Support ── */}
      <Tabs.Screen
        name="support"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={TicketCheck} label="Support" focused={focused} />
          ),
        }}
      />

      {/* ── Settings ── */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={Settings} label="Settings" focused={focused} />
          ),
        }}
      />

      {/* ── Hidden screens ── */}
      <Tabs.Screen name="jobs/[projectId]" options={{ href: null }} />
      <Tabs.Screen name="jobs/create" options={{ href: null, presentation: 'modal' }} />
    </Tabs>
  )
}
