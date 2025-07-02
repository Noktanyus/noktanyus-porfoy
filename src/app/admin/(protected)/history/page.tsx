/**
 * @file Değişiklik geçmişi sayfası (sunucu tarafı).
 * @description Bu sunucu bileşeni, `getCommitHistory` ve `getGitRepoUrl` fonksiyonlarını
 *              kullanarak Git geçmişini ve depo URL'sini alır. Ardından bu verileri,
 *              istemci tarafında interaktif bir arayüz sunan `HistoryClientPage`
 *              bileşenine prop olarak geçirir.
 */

import { getCommitHistory, getGitRepoUrl } from "@/lib/git-utils";
import { HistoryClientPage } from "@/components/admin/HistoryClientPage";

// Bu sayfanın her istekte yeniden render edilmesini ve statik olarak oluşturulmamasını sağlar.
// Böylece her zaman en güncel commit geçmişi gösterilir.
export const dynamic = 'force-dynamic';

/**
 * Değişiklik geçmişi sayfasının ana sunucu bileşeni.
 */
export default async function HistoryPage() {
  // Sunucu tarafında Git commit geçmişini ve depo URL'sini al.
  const rawCommits = await getCommitHistory();
  const repoUrl = await getGitRepoUrl();

  // Alınan ham commit verisini, istemci bileşenine gönderilecek daha basit bir formata dönüştür.
  // Bu, gereksiz veya serialize edilemeyen verilerin istemciye gönderilmesini önler.
  const commits = rawCommits.map(commit => ({
    hash: commit.hash,
    date: commit.date,
    message: commit.message,
    author_name: commit.author_name,
    author_email: commit.author_email,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">İçerik Değişiklik Geçmişi</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        İçerik üzerinde yapılan son 50 değişiklik burada listelenir. 
        "Geçmişe Al" işlemi, seçilen değişikliği geri alır ve bu işlem geri alınamaz.
      </p>
      {/* Alınan verileri istemci bileşenine prop olarak geçir. */}
      <HistoryClientPage commits={commits} repoUrl={repoUrl || '#'} />
    </div>
  );
}
