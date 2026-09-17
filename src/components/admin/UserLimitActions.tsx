'use client';

/**
 * UserLimitActions — Admin tablosunda kullanıcının kota ve kredi durumunu gösteren
 * ve UserLimitModal'ı açan buton/arayüz bileşeni.
 */

import { useState } from 'react';
import { UserLimitModal, type UserLimitData } from './UserLimitModal';
import { FaSlidersH, FaCoins, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface UserLimitActionsProps {
  user: UserLimitData;
}

export function UserLimitActions({ user }: UserLimitActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const hasCustomLimit = user.customApiMonthlyLimit !== null && user.customApiMonthlyLimit !== undefined;
  const isExpired = user.customApiLimitExpiresAt
    ? new Date(user.customApiLimitExpiresAt).getTime() < Date.now()
    : false;

  return (
    <>
      <div className="flex flex-col gap-1 items-start">
        <div className="flex items-center gap-1.5 flex-wrap">
          {hasCustomLimit ? (
            isExpired ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <FaExclamationTriangle className="w-2.5 h-2.5" />
                Süresi Dolmuş ({user.customApiMonthlyLimit?.toLocaleString('tr-TR')}/ay)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <FaCheckCircle className="w-2.5 h-2.5" />
                Özel: {user.customApiMonthlyLimit?.toLocaleString('tr-TR')}/ay
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">Standart Plan</span>
          )}

          {(user.apiCreditBalance ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <FaCoins className="w-2.5 h-2.5" />
              {user.apiCreditBalance?.toLocaleString('tr-TR')} bakiye
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline font-medium mt-0.5 py-0.5 focus:outline-none"
        >
          <FaSlidersH className="w-3 h-3" />
          {hasCustomLimit ? 'Kotayı Yönet / Ekle' : 'Özel Limit Tanımla'}
        </button>
      </div>

      {modalOpen && (
        <UserLimitModal
          user={user}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
