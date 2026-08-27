import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { blogApi, productApi } from '@/lib/api';
import type { Blog, Product } from '@/types';

export default function Home() {
  const blogs = useQuery({
    queryKey: ['blogs', 1],
    queryFn: async () => (await blogApi.list(1)).data,
  });
  const products = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await productApi.list()).data,
  });

  const onRefresh = () => {
    blogs.refetch();
    products.refetch();
  };

  const isLoading = blogs.isLoading || products.isLoading;

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl
          refreshing={blogs.isFetching || products.isFetching}
          onRefresh={onRefresh}
        />
      }
    >
      <View className="p-4">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground">Yunus Tuğhan</Text>
          <Text className="text-base text-muted-foreground mt-1">
            Software Developer
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="oklch(0.55 0.18 255)" />
        ) : (
          <>
            <Text className="text-xl font-semibold mb-3 text-foreground">
              Son Blog Yazıları
            </Text>
            {blogs.data?.data?.slice(0, 3).map((post: Blog) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block mb-3 p-3 bg-white rounded-lg"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Text className="font-semibold text-foreground">{post.title}</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  {post.description}
                </Text>
              </Link>
            ))}

            <Text className="text-xl font-semibold mt-6 mb-3 text-foreground">
              Öne Çıkan Ürünler
            </Text>
            {products.data?.data?.slice(0, 3).map((product: Product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="block mb-3 p-3 bg-white rounded-lg"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Text className="font-semibold text-foreground">{product.title}</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  ₺{product.price.toFixed(2)}
                </Text>
              </Link>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}