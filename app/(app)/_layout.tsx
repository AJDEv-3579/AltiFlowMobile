import { useEffect } from 'react'
import { Tabs, router } from 'expo-router'
import { View, Text, Platform } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { isInternal, isClient } from '../../lib/auth'
import { BlurView } from 'expo-blur'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6, opacity: focused ? 1 : 0.6 }}>
      <Text style={{ fontSize: 20, marginBottom: 2 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color: focused ? '#3b82f6' : '#a1a1aa',
      }}>{label}</Text>
    </View>
  )
}

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) return null;

  if (!user) {
    return null;
  }

  const showAdmin = isInternal(user.role)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0f0f14',
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: 64,
          elevation: 0,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView tint="dark" intensity={80} style={{ flex: 1, backgroundColor: 'rgba(9, 9, 11, 0.7)' }} />
          ) : null
        ),
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#a1a1aa',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📁" label="Projects" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="jobs/[projectId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="jobs/create"
        options={{
          href: null,
          presentation: 'modal',
        }}
      />
      <Tabs.Screen
        name="assigned"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Assigned" focused={focused} />,
          href: showAdmin ? undefined : null, // Hide from tab bar if not admin
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Settings" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
