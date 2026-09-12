/**
 * @file /auth/oauth/consent — OAuth 2.0 Consent UI
 * @description Kullanıcıya uygulamanın talep ettiği scope'ları gösterir.
 *              Allow/Deny kararı → /api/auth/oauth/authorize/decision'a
 *              POST edilir, orada code üretilip redirect edilir.
 *
 *              Server component olarak:
 *              - Session kontrolü (login zorunlu)
 *              - Query param validate (client_id, redirect_uri, scope, code_challenge, state)
 *              - Client lookup + scope whitelist (UI'a sadece izinli scope'lar düşer)
 *
 *              Client component: Allow/Deny formu.
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findActiveClient, validateRedirectUri, validateScopes } from '@/modules/oauth/service';
import { ConsentForm } from '@/components/oauth/ConsentForm';

export const metadata: Metadata = {
  title: 'Uygulama Erişim İzni',
  description: 'OAuth 2.0 consent ekranı',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Scope açıklamaları — kullanıcıya gösterilecek human-readable metinler
const SCOPE_LABELS: Record<string, { title: string; description: string }> = {
  'read:profile': {
    title: 'Profil bilgilerinizi okuma',
    description: 'Ad, e-posta ve profil bilgilerinize erişim',
  },
  'write:profile': {
    title: 'Profil bilgilerinizi düzenleme',
    description: 'Profil bilgilerinizi güncelleme yetkisi',
  },
  'read:monitor': {
    title: 'Monitör verilerinizi okuma',
    description: 'Uptime monitörlerinizi ve check geçmişinizi görüntüleme',
  },
  'write:monitor': {
    title: 'Monitör yönetimi',
    description: 'Yeni monitör oluşturma, düzenleme ve silme',
  },
  'read:orders': {
    title: 'Sipariş geçmişinizi okuma',
    description: 'Geçmiş sipariş ve ödeme bilgilerinize erişim',
  },
  'read:ai': {
    title: 'AI üretimlerini okuma',
    description: 'AI ile ürettiğiniz içeriklere erişim',
  },
  'write:ai': {
    title: 'AI üretimi yapma',
    description: 'AI kullanarak blog/product açıklaması üretme (kotanızdan düşer)',
  },
  'read:webhooks': {
    title: 'Webhook yapılandırmanızı okuma',
    description: 'Webhook endpoint\'lerinizi ve teslimat geçmişini görüntüleme',
  },
  'write:webhooks': {
    title: 'Webhook yönetimi',
    description: 'Webhook oluşturma, düzenleme ve silme',
  },
  admin: {
    title: 'Tam yönetici erişimi',
    description: 'Hesabınız üzerinde tüm yönetici aksiyonları (dikkatli olun)',
  },
};

interface ConsentPageProps {
  searchParams: {
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
  };
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  // 1. Login kontrolü — login değilse geri dönüş URL'i ile /giris'e yönlendir
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const currentUrl =
      '/auth/oauth/consent?' +
      new URLSearchParams(searchParams as Record<string, string>).toString();
    redirect(`/giris?callbackUrl=${encodeURIComponent(currentUrl)}`);
  }

  // 2. Parametrelerin varlığını kontrol et
  const {
    client_id,
    redirect_uri,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  } = searchParams;

  if (!client_id || !redirect_uri || !scope || !code_challenge) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass-card-premium p-8 max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Geçersiz istek</h1>
          <p className="text-sm text-muted-foreground">
            OAuth parametreleri eksik. Lütfen uygulamaya geri dönün ve yeniden
            başlatın.
          </p>
        </div>
      </main>
    );
  }

  // 3. Client doğrula
  const client = await findActiveClient(client_id);
  if (!client) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass-card-premium p-8 max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Bilinmeyen uygulama
          </h1>
          <p className="text-sm text-muted-foreground">
            Bu client_id sistemde kayıtlı değil veya iptal edilmiş.
          </p>
        </div>
      </main>
    );
  }

  // 4. Redirect URI whitelist kontrolü
  if (!validateRedirectUri(client, redirect_uri)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="glass-card-premium p-8 max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Geçersiz yönlendirme
          </h1>
          <p className="text-sm text-muted-foreground">
            İstenen yönlendirme adresi uygulamanın whitelist\'inde değil.
          </p>
        </div>
      </main>
    );
  }

  // 5. Scope whitelist kontrolü — yalnızca izinli scope'lar UI'da gösterilir
  const requestedScopes = scope.trim().split(/\s+/);
  const scopeCheck = validateScopes(client, requestedScopes);
  const grantedScopes = scopeCheck.granted;

  // 6. UI'a gönderilecek scope açıklamaları
  const scopesForUi = grantedScopes.map((s) => ({
    key: s,
    title: SCOPE_LABELS[s]?.title ?? s,
    description: SCOPE_LABELS[s]?.description ?? 'Özel yetki',
  }));

  return (
    <main className="min-h-screen flex items-center justify-center bg-blob-decoration px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="glass-card-premium p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <svg
                className="h-7 w-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-1">Uygulama Erişim İzni</h1>
            <p className="text-sm text-muted-foreground">
              <strong>{client.name}</strong> uygulaması hesabınıza erişmek
              istiyor.
            </p>
          </div>

          {/* User info */}
          <div className="rounded-lg border border-border bg-card/50 p-3 mb-4 text-sm">
            <span className="text-muted-foreground">Giriş yapmış hesap:</span>{' '}
            <strong>{session.user.email ?? 'Bilinmeyen'}</strong>
          </div>

          {/* Permission list */}
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3">
              Bu uygulama aşağıdaki izinleri istiyor:
            </p>
            <ul className="space-y-3">
              {scopesForUi.map((s) => (
                <li
                  key={s.key}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3"
                >
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="h-3 w-3 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 mb-6 text-xs text-amber-900 dark:text-amber-200">
            <strong>Dikkat:</strong> Bu uygulamaya izin verirseniz,{' '}
            <strong>{client.name}</strong> yukarıdaki yetkilerle hesabınıza
            erişebilir. İzin'i istediğiniz zaman OAuth ayarlarınızdan
            kaldırabilirsiniz.
          </div>

          {/* Allow / Deny form */}
          <ConsentForm
            clientId={client_id}
            redirectUri={redirect_uri}
            scope={scope}
            state={state ?? null}
            codeChallenge={code_challenge}
            codeChallengeMethod={code_challenge_method ?? 'S256'}
          />
        </div>
      </div>
    </main>
  );
}
