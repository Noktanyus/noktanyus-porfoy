import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productApi } from '@/lib/api';
import { useAuth, useCart } from '@/lib/store';

export default function ProductDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const addItem = useCart((s) => s.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await productApi.get(slug!)).data,
    enabled: !!slug,
  });

  const product = data?.data;

  const handleBuy = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Satın almak için giriş yapmalısınız.', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Giriş Yap', onPress: () => router.push('/login') },
      ]);
      return;
    }
    if (!product) return;
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: 1,
    });
    Alert.alert('Sepete Eklendi', 'Ödeme sayfasına yönlendiriliyorsunuz.', [
      { text: 'Tamam', onPress: () => router.push('/checkout') },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="oklch(0.55 0.18 255)" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground">{product?.title}</Text>
        <Text className="text-sm text-muted-foreground mt-2">
          {product?.description}
        </Text>

        <View className="bg-white rounded-lg p-4 mt-4">
          <Text className="text-3xl font-bold text-primary">
            ₺{product?.price?.toFixed(2)}
          </Text>
          <TouchableOpacity
            onPress={handleBuy}
            className="bg-primary p-4 rounded-lg mt-4 flex-row items-center justify-center"
          >
            <Ionicons name="cart" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Satın Al</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}