import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

// Projeler public blog benzeri bir endpoint üzerinden gelirse
// (Next.js tarafında /api/projects yoksa projeler sayfasından çekilebilir)
async function fetchProjects() {
  try {
    const res = await api.get('/api/projects');
    return res.data;
  } catch {
    // Fallback boş liste
    return { data: [] };
  }
}

export default function Projects() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      {isLoading ? (
        <ActivityIndicator size="large" color="oklch(0.55 0.18 255)" />
      ) : (
        <>
          <Text className="text-2xl font-bold mb-4 text-foreground">Projelerim</Text>
          {(data?.data ?? []).length === 0 ? (
            <View className="items-center mt-10">
              <Ionicons name="rocket-outline" size={48} color="oklch(0.50 0 0)" />
              <Text className="text-muted-foreground mt-3">
                Henüz proje eklenmedi.
              </Text>
            </View>
          ) : (
            data.data.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.slug}`} asChild>
                <Pressable className="mb-3 p-4 bg-white rounded-lg">
                  <Text className="font-semibold text-lg text-foreground">
                    {project.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    {project.description}
                  </Text>
                </Pressable>
              </Link>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}