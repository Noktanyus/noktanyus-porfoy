"use client";

import { useState } from "react";
import toast from "react-hot-toast";

// Basit, serialize edilebilir commit tipi
type SimpleCommit = {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
};

interface HistoryClientPageProps {
  commits: readonly SimpleCommit[];
  repoUrl: string;
}

export function HistoryClientPage({ commits, repoUrl }: HistoryClientPageProps) {
  const [isReverting, setIsReverting] = useState<string | null>(null);

  const handleRevert = async (hash: string) => {
    if (!confirm(`"${hash.substring(0, 7)}" hash'li commit'i geri almak istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    setIsReverting(hash);
    const loadingToast = toast.loading("Commit geri alınıyor...");

    try {
      const response = await fetch('/api/admin/git/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Geri alma işlemi başarısız oldu.");
      }

      toast.success("Commit başarıyla geri alındı! Değişikliklerin yansıması biraz zaman alabilir.", { id: loadingToast });
      window.location.reload();

    } catch (error) {
      toast.error((error as Error).message, { id: loadingToast });
    } finally {
      setIsReverting(null);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {commits.map((commit) => (
          <li key={commit.hash} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-brand-primary line-clamp-2">{commit.message}</p>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-1 sm:space-y-0">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {commit.hash.substring(0, 7)}
                    </span>
                    <span className="hidden sm:inline">by</span>
                    <strong className="truncate max-w-[150px] sm:max-w-none">{commit.author_name}</strong>
                  </div>
                  <div className="sm:inline">
                    <span className="hidden sm:inline">on </span>
                    <time dateTime={commit.date} className="text-xs sm:text-sm">
                      {new Date(commit.date).toLocaleString('tr-TR')}
                    </time>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <a
                  href={`${repoUrl}/commit/${commit.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-secondary text-center text-xs sm:text-sm"
                >
                  Görüntüle
                </a>
                <button
                  onClick={() => handleRevert(commit.hash)}
                  disabled={isReverting === commit.hash}
                  className="admin-button bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 text-xs sm:text-sm"
                >
                  {isReverting === commit.hash ? "Geri Alınıyor..." : "Geçmişe Al"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}