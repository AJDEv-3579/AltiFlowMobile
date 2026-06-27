import { useEffect } from 'react'
import { Tabs, router } from 'expo-router'
import { View, Text, TouchableOpacity } from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { isInternal, isClient } from '../../lib/auth'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      <Text style={{
        fontSize: 10, marginTop: 2, fontWeight: focused ? '700' : '400',
        color: focused ? '#818cf8' : '#71717a',
      }}>{label}</Text>
    </View>
  )
}

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) return null; // Wait for auth check

  if (!user) {
    // If not logged in, RootLayout will handle redirect, but as a safety:
    return null;
  }

  const showAdmin = isInternal(user.role)
  const showClient = isClient(user.role)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f1a',
          borderTopColor: '#2a2a3d',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#71717a',
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
          href: null, // hidden from tab bar, accessible via navigation
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
          tabBarItemStyle: !showAdmin ? { display: 'none' } : {},
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
