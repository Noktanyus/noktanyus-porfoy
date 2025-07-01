// src/app/admin/(protected)/history/page.tsx
import { getCommitHistory } from "@/lib/git-utils";
import { HistoryClientPage } from "@/components/admin/HistoryClientPage";

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const rawCommits = await getCommitHistory();
  
  // Sunucu -> İstemci veri aktarımı için commit nesnelerini serialize et
  const commits = rawCommits.map(commit => ({
    hash: commit.hash,
    date: commit.date, // Tarih string olarak zaten uyumlu
    message: commit.message,
    author_name: commit.author_name,
    author_email: commit.author_email,
  }));

  const repoUrl = "https://github.com/kullanici/repo-adi"; // TODO: Kendi repo URL'nizle değiştirin.

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Değişiklik Geçmişi</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        İçerik üzerinde yapılan son 50 değişiklik burada listelenir. "Geçmişe Al" işlemi geri alınamaz.
      </p>
      <HistoryClientPage commits={commits} repoUrl={repoUrl} />
    </div>
  );
}