/**
 * @file Değişiklik geçmişi sayfası (sunucu tarafı).
 * @description Bu sunucu bileşeni, `getCommitHistory` ve `getGitRepoUrl` fonksiyonlarını
 *              kullanarak Git geçmişini ve depo URL'sini alır. Ardından bu verileri,
 *              istemci tarafında interaktif bir arayüz sunan `HistoryClientPage`
 *              bileşenine prop olarak geçirir.
 */

import { getCommitHistory, getGitRepoUrl } from "@/lib/git-utils";
import { HistoryClientPage } from "@/components/admin/HistoryClientPage";
import { PageHeader } from "@/components/dashboard/PageHeader";

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
    <div className="admin-content-spacing">
      <PageHeader
        title="İçerik Değişiklik Geçmişi"
        description={`Son ${commits.length} değişiklik listelenir. "Geçmişe Al" işlemi seçilen değişikliği geri alır ve geri alınamaz.`}
        breadcrumb={<span>Admin / Değişiklik Geçmişi</span>}
      />
      {/* Alınan verileri istemci bileşenine prop olarak geçir. */}
      <HistoryClientPage commits={commits} repoUrl={repoUrl || '#'} />
    </div>
  );
}
