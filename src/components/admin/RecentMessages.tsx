/**
 * @file Yönetim panelindeki son gelen mesajları gösteren bileşen.
 * @description Bu bileşen, mesaj listesini ve yüklenme durumunu prop olarak alır ve görüntüler.
 */
"use client";

import { Message } from "@/types/content";
import Link from "next/link";

interface RecentMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function RecentMessages({ messages, isLoading }: RecentMessagesProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Son Gelen Mesajlar</h2>
        <Link href="/admin/messages" className="text-sm text-brand-primary hover:underline">
          Tümünü Gör
        </Link>
      </div>
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md min-h-[200px]">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ) : (
          messages.length > 0 ? (
            <ul className="space-y-4">
              {messages.map(msg => (
                <li key={msg.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">{msg.name} - <span className="text-gray-500 dark:text-gray-400">{msg.subject}</span></p>
                    <span className="text-sm text-gray-400 dark:text-gray-500">{new Date(msg.timestamp).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">{msg.message}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">Gösterilecek yeni mesaj bulunmuyor.</p>
          )
        )}
      </div>
    </div>
  );
}
