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

const registerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir e-posta giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    const validation = registerSchema.safeParse({ name, email, password });
    if (!validation.success) {
      Alert.alert('Hata', validation.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      await authApi.register(validation.data);
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu. Giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => router.replace('/login') },
      ]);
    } catch (err: any) {
      Alert.alert(
        'Hata',
        err?.response?.data?.error ?? 'Kayıt sırasında bir hata oluştu'
      );
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
          <Ionicons name="person-add" size={48} color="oklch(0.55 0.18 255)" />
        </View>
        <Text className="text-3xl font-bold mb-2 text-foreground">Kayıt Ol</Text>
        <Text className="text-sm text-muted-foreground mb-6">
          Yeni bir hesap oluşturun.
        </Text>

        <TextInput
          placeholder="Ad Soyad"
          value={name}
          onChangeText={setName}
          className="border border-border bg-white p-3 rounded-lg mb-3 text-foreground"
        />
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
          placeholder="Şifre (en az 8 karakter)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="border border-border bg-white p-3 rounded-lg mb-4 text-foreground"
        />

        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          className="bg-primary p-4 rounded-lg flex-row justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold">Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <Link href="/login" asChild>
          <TouchableOpacity className="mt-4">
            <Text className="text-primary text-center">
              Hesabınız var mı? Giriş Yap
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}