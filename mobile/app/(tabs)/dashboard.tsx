import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/store';

const menuItems = [
  { href: '/dashboard/api-keys', icon: 'key', label: 'API Anahtarları' },
  { href: '/dashboard/monitors', icon: 'pulse', label: 'Monitorler' },
  { href: '/dashboard/alert-channels', icon: 'notifications', label: 'Uyarı Kanalları' },
  { href: '/dashboard/orders', icon: 'receipt', label: 'Siparişlerim' },
  { href: '/dashboard/billing', icon: 'card', label: 'Faturalandırma' },
  { href: '/dashboard/settings', icon: 'settings', label: 'Ayarlar' },
];

export default function Dashboard() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);

  const handleSignOut = async () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istiyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-xl font-bold text-foreground">
            {user?.name ?? 'Misafir'}
          </Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {user?.email ?? 'Giriş yapılmadı'}
          </Text>
        </View>

        {!user && (
          <Pressable
            onPress={() => router.push('/login')}
            className="bg-primary p-4 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-semibold">Giriş Yap</Text>
          </Pressable>
        )}

        <Text className="text-lg font-semibold mb-3 text-foreground">Menü</Text>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href as any} asChild>
            <Pressable className="flex-row items-center p-4 bg-white rounded-lg mb-2">
              <Ionicons name={item.icon as any} size={22} color="oklch(0.55 0.18 255)" />
              <Text className="ml-3 text-foreground flex-1">{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="oklch(0.50 0 0)" />
            </Pressable>
          </Link>
        ))}

        {user && (
          <Pressable
            onPress={handleSignOut}
            className="mt-4 p-4 bg-destructive rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Çıkış Yap</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}