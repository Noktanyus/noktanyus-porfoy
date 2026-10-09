'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { DS } from '@/lib/design-system';

const PRESETS = [
  {
    id: 'iban',
    label: 'IBAN doğrula',
    path: '/api/v1/validate/iban',
    body: '{\n  "iban": "TR330006100519786457841326"\n}',
  },
  {
    id: 'overtime',
    label: 'Fazla mesai',
    path: '/api/v1/labor/overtime',
    body: '{\n  "monthlyGrossCents": 4500000,\n  "hours": 10,\n  "kind": "overtime"\n}',
  },
  {
    id: 'gross',
    label: 'Brüt → net',
    path: '/api/v1/labor/gross-to-net',
    body: '{\n  "monthlyGrossCents": 5000000,\n  "monthIndex": 1\n}',
  },
  {
    id: 'ubl',
    label: 'UBL lint',
    path: '/api/v1/invoice/ubl-validate',
    body: '{\n  "xml": "<?xml version=\\"1.0\\"?><Invoice xmlns:cbc=\\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\\" xmlns:cac=\\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\\"><cbc:ProfileID>TICARIFATURA</cbc:ProfileID><cbc:ID>ABC2026000000001</cbc:ID><cbc:IssueDate>2026-10-09</cbc:IssueDate><cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode><cac:AccountingSupplierParty/><cac:AccountingCustomerParty/><cac:LegalMonetaryTotal/><cac:InvoiceLine/></Invoice>"\n}',
  },
] as const;

export function ApiPlaygroundClient({ suggestedKeyPrefix }: { suggestedKeyPrefix?: string }) {
  const [apiKey, setApiKey] = useState('');
  const [path, setPath] = useState(PRESETS[0].path);
  const [body, setBody] = useState(PRESETS[0].body);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const applyPreset = (id: (typeof PRESETS)[number]['id']) => {
    const p = PRESETS.find((x) => x.id === id)!;
    setPath(p.path);
    setBody(p.body);
  };

  const run = async () => {
    if (!apiKey.trim()) {
      toast.error('API anahtarı gerekli (canlı veya test)');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
        },
        body,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* raw */
      }
      setResult(`${res.status} ${res.statusText}\n\n${pretty}`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'İstek başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className="admin-btn admin-btn-secondary text-sm"
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">
          API key {suggestedKeyPrefix ? `(örn. ${suggestedKeyPrefix}…)` : ''}
        </span>
        <input
          type="password"
          autoComplete="off"
          className={DS.input}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="nok_live_… veya nok_test_…"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">Endpoint</span>
        <input className={DS.input} value={path} onChange={(e) => setPath(e.target.value)} />
      </label>

      <label className="block text-sm">
        <span className="font-medium mb-1.5 block">JSON body</span>
        <textarea
          className={`${DS.input} font-mono text-xs`}
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className={`${DS.button.primary} px-5 min-h-[44px]`}
      >
        {loading ? 'Gönderiliyor…' : 'Çalıştır'}
      </button>

      {result && (
        <pre className="rounded-2xl border border-border bg-slate-950 text-slate-100 p-4 text-xs overflow-x-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
