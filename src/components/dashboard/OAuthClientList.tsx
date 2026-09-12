/**
 * @file OAuth Clients List Bileşeni
 * @description OAuth 2.0 client'larını tablo halinde listeler.
 *              Aktif/revoked durum rozeti, scope/redirect göstergesi, revoke butonu.
 *              Empty state PageStates üzerinden tek kaynaktan gelir.
 */

'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FaCopy, FaCheckCircle, FaBan } from 'react-icons/fa';
import { formatDate } from '@/lib/utils';
import { PageStates } from '@/components/ui/PageStates';
import { RevokeClientButton } from './RevokeClientButton';

export interface OAuthClientRow {
  id: string;
  clientId: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
  createdAt: string;
  revokedAt: string | null;
}

export function OAuthClientList({ clients }: { clients: OAuthClientRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı`);
  };

  return (
    <PageStates
      data={clients}
      emptyTitle="Henüz OAuth client yok"
      emptyDescription="İlk client'ınızı oluşturarak başlayın"
      emptyIcon="🔐"
    >
      {(rows) => (
        <div className="glass-card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th scope="col" className="text-left font-medium px-4 py-3">İsim</th>
                  <th scope="col" className="text-left font-medium px-4 py-3">Client ID</th>
                  <th scope="col" className="text-left font-medium px-4 py-3 hidden md:table-cell">
                    Scopes
                  </th>
                  <th scope="col" className="text-left font-medium px-4 py-3 hidden lg:table-cell">
                    Redirect URIs
                  </th>
                  <th scope="col" className="text-left font-medium px-4 py-3 hidden md:table-cell">
                    Oluşturulma
                  </th>
                  <th scope="col" className="text-left font-medium px-4 py-3">Durum</th>
                  <th scope="col" className="text-right font-medium px-4 py-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const isRevoked = !!c.revokedAt;
                  const isExpanded = expandedId === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${
                        isRevoked ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{c.name}</p>
                        {/* mobile scopes */}
                        <div className="md:hidden flex flex-wrap gap-1 mt-1">
                          {c.scopes.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                            >
                              {s}
                            </span>
                          ))}
                          {c.scopes.length > 2 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{c.scopes.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono break-all">
                            {c.clientId.slice(0, 12)}…
                          </code>
                          <button
                            type="button"
                            onClick={() => copy(c.clientId, 'Client ID')}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Client ID kopyala"
                            title="Kopyala"
                          >
                            <FaCopy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {c.scopes.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                            >
                              {s}
                            </span>
                          ))}
                          {c.scopes.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                    setExpandedId(isExpanded ? null : c.id)
                                  }
                              className="text-[10px] text-muted-foreground hover:text-foreground self-center"
                            >
                              +{c.scopes.length - 2}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {c.redirectUris.slice(0, 1).map((uri, idx) => (
                            <code
                              key={idx}
                              className="text-[10px] font-mono text-muted-foreground truncate max-w-[14rem]"
                              title={uri}
                            >
                              {uri}
                            </code>
                          ))}
                          {c.redirectUris.length > 1 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{c.redirectUris.length - 1} daha
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                            <FaBan className="w-3 h-3" />
                            İptal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/10 text-green-700 dark:text-green-300">
                            <FaCheckCircle className="w-3 h-3" />
                            Aktif
                          </span>
                        )}
                        {isRevoked && c.revokedAt && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatDate(c.revokedAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isRevoked ? (
                          <RevokeClientButton id={c.id} name={c.name} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Expanded detail panel — mobil veya +N scopes tıklandığında detay */}
          {expandedId && (
            <div className="border-t border-border bg-muted/20 p-4 space-y-3">
              {(() => {
                const c = rows.find((x) => x.id === expandedId);
                if (!c) return null;
                return (
                  <>
                    <div>
                      <p className="text-xs font-medium mb-1.5">Tüm Scopes</p>
                      <div className="flex flex-wrap gap-1">
                        {c.scopes.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5">Tüm Redirect URIs</p>
                      <div className="space-y-1">
                        {c.redirectUris.map((uri, idx) => (
                          <code
                            key={idx}
                            className="block text-[10px] font-mono text-muted-foreground break-all"
                          >
                            {uri}
                          </code>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(null)}
                      className="text-xs text-primary hover:underline"
                    >
                      Detayı kapat
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </PageStates>
  );
}

export default OAuthClientList;