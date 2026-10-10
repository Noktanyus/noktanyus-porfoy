# Noktanyus TypeScript / JavaScript SDK

**TR:** Sıfır runtime bağımlılığı — yalnızca native `fetch` (Node 18+, Bun, Deno, modern tarayıcılar).  
**EN:** Zero runtime deps — native `fetch` only (Node 18+, Bun, Deno, modern browsers).

```bash
# from repo
cd sdk/typescript && npm install && npm run build
# or link: npm install ./sdk/typescript
```

```ts
import { NoktanyusTrClient, NoktanyusApiError } from 'noktanyus';

const client = new NoktanyusTrClient('ny_live_xxx');
// or: new NoktanyusTrClient({ apiKey: 'ny_live_xxx' })

try {
  const health = await client.health();
  console.log(health.status);

  const iban = await client.validateIban('TR330006100519786457841326');
  console.log(iban.valid, iban.bankName);

  const id = await client.validateIdentity({ type: 'tckn', value: '10000000146' });
  console.log(id.valid);
} catch (e) {
  if (e instanceof NoktanyusApiError) {
    console.error(e.code, e.statusCode, e.message);
  }
}
```

Auth header: `x-api-key` (same as Python SDK).  
Docs: https://noktanyus.com/docs/sdk

Also see: `sdk/python/` · monorepo client: `src/sdk/`
