import { useEffect } from 'react'
import { Tabs, router } from 'expo-router'
import { View, Text, Platform } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { isInternal } from '../../lib/auth'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../lib/design'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({ name, label, focused }: { name: IoniconsName; label: string; focused: boolean }) {
  const col = focused ? colors.primary : colors.textFaint
  return (
    <View style={{ alignItems: 'center', paddingTop: 8 }}>
      <Ionicons name={name} size={23} color={col} />
      <Text style={{ fontSize: 10, marginTop: 3, fontWeight: focused ? '700' : '500', color: col, letterSpacing: 0.2 }}>
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
    if (!loading && !user) router.replace('/(auth)')
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
            <BlurView tint="dark" intensity={85} style={{ flex: 1, backgroundColor: 'rgba(9,9,11,0.75)' }} />
          ) : null,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="bar-chart-outline" label="Dashboard" focused={focused} /> }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="briefcase-outline" label="Pipeline" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="folder-open-outline" label="Projects" focused={focused} /> }}
      />
      <Tabs.Screen
        name="assigned"
        options={{
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon name="clipboard-outline" label="My Jobs" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="ticket-outline" label="Support" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="settings-outline" label="Settings" focused={focused} /> }}
      />
      <Tabs.Screen name="jobs/[projectId]" options={{ href: null }} />
      <Tabs.Screen name="jobs/create" options={{ href: null, presentation: 'modal' }} />
    </Tabs>
  )
}
