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
          <li key={commit.hash} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-primary truncate">{commit.message}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{commit.hash.substring(0, 7)}</span>
                  {' by '}
                  <strong>{commit.author_name}</strong>
                  {' on '}
                  <time dateTime={commit.date}>{new Date(commit.date).toLocaleString('tr-TR')}</time>
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                <a
                  href={`${repoUrl}/commit/${commit.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md transition"
                >
                  Görüntüle
                </a>
                <button
                  onClick={() => handleRevert(commit.hash)}
                  disabled={isReverting === commit.hash}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition disabled:bg-red-400"
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