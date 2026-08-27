import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';

export default function BlogDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => (await blogApi.get(slug!)).data,
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="oklch(0.55 0.18 255)" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-destructive">Blog yazısı yüklenemedi.</Text>
      </View>
    );
  }

  const post = data?.data;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-2xl font-bold text-foreground mb-2">
          {post?.title}
        </Text>
        {post?.publishedAt && (
          <Text className="text-xs text-muted-foreground mb-4">
            {new Date(post.publishedAt).toLocaleDateString('tr-TR')}
          </Text>
        )}
        <Text className="text-base text-foreground leading-6">
          {post?.content ?? post?.description}
        </Text>
      </View>
    </ScrollView>
  );
}