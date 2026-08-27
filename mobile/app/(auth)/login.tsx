import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/store';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setSession } = useAuth();

  const handleLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      Alert.alert('Hata', validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      // NextAuth Credentials provider çağrısı
      await authApi.login(email, password);
      const sessionRes = await authApi.session();
      const sessionUser = sessionRes.data?.user;

      if (sessionUser) {
        await setSession(
          {
            id: sessionUser.id ?? sessionUser.email,
            email: sessionUser.email,
            name: sessionUser.name,
            image: sessionUser.image,
          },
          // NextAuth JWT session cookie'sini SecureStore'da sakla
          sessionRes.data?.token ?? 'nextauth-session'
        );
        router.replace('/');
      } else {
        Alert.alert('Hata', 'Giriş başarısız oldu.');
      }
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.error ?? 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center p-6">
        <View className="items-center mb-8">
          <Ionicons name="lock-closed" size={48} color="oklch(0.55 0.18 255)" />
        </View>
        <Text className="text-3xl font-bold mb-2 text-foreground">Giriş Yap</Text>
        <Text className="text-sm text-muted-foreground mb-6">
          Hesabınıza giriş yaparak tüm özelliklere erişin.
        </Text>

        <TextInput
          placeholder="E-posta"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="border border-border bg-white p-3 rounded-lg mb-3 text-foreground"
        />
        <TextInput
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="border border-border bg-white p-3 rounded-lg mb-4 text-foreground"
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="bg-primary p-4 rounded-lg flex-row justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">Giriş Yap</Text>
          )}
        </TouchableOpacity>

        <Link href="/register" asChild>
          <TouchableOpacity className="mt-4">
            <Text className="text-primary text-center">
              Hesabınız yok mu? Kayıt Ol
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}