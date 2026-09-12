/**
 * @file ConsentForm — OAuth 2.0 Consent UI'daki Allow/Deny client component
 * @description /api/auth/oauth/authorize/decision endpoint'ine POST eder.
 *              Form-data olarak gönderir (server-side hem form-data hem JSON kabul eder).
 */

'use client';

import { useState } from 'react';

interface ConsentFormProps {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string | null;
  codeChallenge: string;
  codeChallengeMethod: string;
}

export function ConsentForm({
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
  codeChallengeMethod,
}: ConsentFormProps) {
  const [submitting, setSubmitting] = useState<'allow' | 'deny' | null>(null);

  async function handleSubmit(decision: 'allow' | 'deny') {
    setSubmitting(decision);
    const fd = new FormData();
    fd.set('client_id', clientId);
    fd.set('redirect_uri', redirectUri);
    fd.set('scope', scope);
    if (state) fd.set('state', state);
    fd.set('code_challenge', codeChallenge);
    fd.set('code_challenge_method', codeChallengeMethod);
    fd.set('decision', decision);

    // Decision endpoint redirect ile cevap verir (code ile).
    // fetch()'in redirect'i takip etmesini söylemiyoruz; server 302'yi tarayıcı takip eder.
    try {
      await fetch('/api/auth/oauth/authorize/decision', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
        redirect: 'follow',
      });
    } catch (err) {
      // Network hatası olursa submitting'i reset
      setSubmitting(null);
      console.error('Consent submit failed', err);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => handleSubmit('deny')}
        disabled={submitting !== null}
        className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-muted transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting === 'deny' ? 'Reddediliyor...' : 'Reddet'}
      </button>
      <button
        type="button"
        onClick={() => handleSubmit('allow')}
        disabled={submitting !== null}
        className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting === 'allow' ? 'İzin veriliyor...' : 'İzin Ver'}
      </button>
    </div>
  );
}
