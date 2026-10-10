'use client';

import { useState, useTransition } from 'react';

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeSig(raw: string): string {
  const t = raw.trim();
  return t.startsWith('sha256=') ? t.slice('sha256='.length) : t;
}

export function WebhookHmacPlayground() {
  const [secret, setSecret] = useState('');
  const [body, setBody] = useState(
    '{\n  "event": "order.paid",\n  "data": { "orderId": "ord_demo" }\n}'
  );
  const [header, setHeader] = useState('');
  const [expected, setExpected] = useState<string | null>(null);
  const [match, setMatch] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runVerify() {
    startTransition(async () => {
      setError(null);
      setMatch(null);
      try {
        if (!secret.trim()) {
          setError('Webhook secret gerekli.');
          return;
        }
        const hex = await hmacSha256Hex(secret.trim(), body);
        const full = `sha256=${hex}`;
        setExpected(full);
        if (header.trim()) {
          setMatch(normalizeSig(header) === hex);
        }
      } catch {
        setError('İmza hesaplanamadı (Web Crypto).');
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
      <div>
        <h2 className="text-base font-bold text-foreground">HMAC doğrulama playground</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tarayıcıda <code className="text-[11px]">X-Webhook-Signature</code> üret / karşılaştır —
          secret sunucuya gitmez.
        </p>
      </div>
      <label className="block text-sm space-y-1">
        <span className="font-medium">Secret</span>
        <input
          type="password"
          autoComplete="off"
          className="admin-input w-full font-mono text-sm"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="whsec_…"
        />
      </label>
      <label className="block text-sm space-y-1">
        <span className="font-medium">Ham JSON gövde</span>
        <textarea
          className="admin-input w-full font-mono text-xs min-h-[120px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spellCheck={false}
        />
      </label>
      <label className="block text-sm space-y-1">
        <span className="font-medium">Gelen header (opsiyonel)</span>
        <input
          className="admin-input w-full font-mono text-xs"
          value={header}
          onChange={(e) => setHeader(e.target.value)}
          placeholder="sha256=…"
        />
      </label>
      <button
        type="button"
        className="admin-btn admin-btn-primary text-sm"
        disabled={pending}
        onClick={runVerify}
      >
        {pending ? 'Hesaplanıyor…' : 'İmzayı hesapla / doğrula'}
      </button>
      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-300" role="alert">
          {error}
        </p>
      )}
      {expected && (
        <div className="rounded-xl border border-border/80 bg-background/50 px-3 py-3 text-sm space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Beklenen header
          </p>
          <code className="block break-all font-mono text-xs">{expected}</code>
          {match !== null && (
            <p
              className={`font-semibold ${
                match
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {match ? 'Eşleşti — imza geçerli.' : 'Eşleşmedi — secret veya gövde farklı.'}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
