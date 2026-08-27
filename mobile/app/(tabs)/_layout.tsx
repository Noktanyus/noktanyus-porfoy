import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useCart } from '@/lib/store';

export default function TabsLayout() {
  const itemCount = useCart((s) => s.totalCount());

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: 'oklch(0.55 0.18 255)',
        tabBarInactiveTintColor: 'oklch(0.50 0 0)',
        headerShown: true,
        headerStyle: { backgroundColor: 'oklch(0.99 0 0)' },
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: 'oklch(0.99 0 0)',
          borderTopColor: 'oklch(0.90 0 0)',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: 'Blog',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projeler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="rocket" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Mağaza',
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="storefront" size={size} color={color} />
              {itemCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -8,
                    backgroundColor: 'oklch(0.60 0.20 25)',
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>
                    {itemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Hesap',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}