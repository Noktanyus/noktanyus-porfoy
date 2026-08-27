import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productApi } from '@/lib/api';
import { useCart } from '@/lib/store';
import type { Product } from '@/types';

export default function Store() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await productApi.list()).data,
  });
  const addItem = useCart((s) => s.addItem);

  const handleAdd = (product: Product) => {
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      quantity: 1,
      coverImage: product.coverImage,
    });
    Alert.alert('Sepete Eklendi', product.title);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="oklch(0.55 0.18 255)" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      data={(data?.data ?? []) as Product[]}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      ListEmptyComponent={
        <Text className="text-center text-muted-foreground mt-10">
          Mağaza şu an boş.
        </Text>
      }
      renderItem={({ item }) => (
        <View
          className="mb-3 p-4 bg-white rounded-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Text className="font-semibold text-lg text-foreground">{item.title}</Text>
          <Text className="text-sm text-muted-foreground mt-1">
            {item.description}
          </Text>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-lg font-bold text-primary">
              ₺{item.price.toFixed(2)}
            </Text>
            <Pressable
              onPress={() => handleAdd(item)}
              className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
            >
              <Ionicons name="cart" size={16} color="white" />
              <Text className="text-white font-semibold ml-1">Ekle</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}