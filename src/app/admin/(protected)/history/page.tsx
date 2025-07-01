"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaHistory } from 'react-icons/fa';

type Commit = {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
};

export default function GitHistoryPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/git/log');
        if (!response.ok) {
          throw new Error('Değişiklik geçmişi yüklenemedi.');
        }
        const data = await response.json();
        setCommits(data);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <FaHistory className="mr-3" />
        İçerik Değişiklik Geçmişi
      </h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Admin panelinden yapılan son 50 içerik değişikliği burada listelenir. Bu kayıtlar, `git` versiyon kontrol sistemi tarafından tutulmaktadır.
      </p>
      <div className="overflow-x-auto">
        {isLoading ? (
          <p>Geçmiş yükleniyor...</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="text-left py-3 px-4 font-semibold">Tarih</th>
                <th className="text-left py-3 px-4 font-semibold">Açıklama</th>
                <th className="text-left py-3 px-4 font-semibold">Yazar</th>
              </tr>
            </thead>
            <tbody>
              {commits.length > 0 ? (
                commits.map((commit) => (
                  <tr key={commit.hash} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(commit.date).toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">{commit.message}</td>
                    <td className="py-3 px-4 text-sm">{commit.author_name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-10">
                    Değişiklik geçmişi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
