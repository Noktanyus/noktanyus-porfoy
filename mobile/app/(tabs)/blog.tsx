import { View, Text, FlatList, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { blogApi } from '@/lib/api';
import type { Blog } from '@/types';

export default function BlogList() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['blogs', 1],
    queryFn: async () => (await blogApi.list(1)).data,
  });

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
      data={(data?.data ?? []) as Blog[]}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      ListEmptyComponent={
        <Text className="text-center text-muted-foreground mt-10">
          Henüz blog yazısı yok.
        </Text>
      }
      renderItem={({ item }) => (
        <Link href={`/blog/${item.slug}`} asChild>
          <Pressable
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
            {item.tags && item.tags.length > 0 && (
              <View className="flex-row mt-2 flex-wrap">
                {item.tags.map((tag) => (
                  <Text
                    key={tag}
                    className="text-xs bg-muted px-2 py-1 rounded mr-1 mb-1 text-muted-foreground"
                  >
                    #{tag}
                  </Text>
                ))}
              </View>
            )}
          </Pressable>
        </Link>
      )}
    />
  );
}