# Noktanyus — sürekli SaaS döngüsü (piyasa + hedefler)

Son güncelleme: 2026-10-10

## Piyasa özeti (API SaaS / developer platform)

Rakipler (Stripe, Twilio, Zuplo, Moesif, Apigee/WSO2): developer portal, usage analytics,
rate-limit görünürlüğü, deprecation/sunset, SSO, agent/MCP yüzeyi.

### Bizde güçlü
- TR API + kota/plan, usage forecast, billing projection (TRY)
- Python SDK, agent markdown `/docs/md`, HMAC playground
- IP allowlist, X-API-Version, Deprecation/Sunset iskeleti
- Latency p50/p95 (Tur 8), request observability headers (Tur 9)

### Boşluklar (öncelik sırası)
1. **Error-rate / 4xx-5xx analytics** — endpoint bazlı hata oranı (Moesif tarzı)
2. **MCP sunucusu** — OpenAPI → agent tools (Stripe MCP trendi)
3. **SSO (SAML/OIDC)** — B2B enterprise (SendGrid/Twilio)
4. **Brownout / deprecation enforcement** — deprecated uçlarda periyodik 503
5. **Webhook delivery retries UI + DLQ** — operasyonel DX
6. **Go/TS SDK** — Python sonrası dil çeşitliliği
7. **Usage anomaly alerts** — ani spike / sessizlik
8. **Public status + incident subscribe** — güven

### Ship edilmiş turlar
- T1–T6: forecast, Python SDK, kota alerts, HMAC, /docs/md, IP+version
- T7: remote deploy verify
- T8: latency insights
- T9: X-Request-Id / RateLimit-Reset / Request-Duration

### Sonraki
- T10: error-rate analytics dashboard
- T11: MCP minimal server veya webhook DLQ

### Ship (T11 slice)
- Option B: `/mcp.json` + `/api/v1/agent/tools` (OpenAPI → MCP-ish tools) + `/docs/mcp` — tam MCP SDK yok
