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
1. **SSO (SAML/OIDC)** — B2B enterprise (SendGrid/Twilio)
2. **Go/TS SDK** — Python sonrası dil çeşitliliği *(minimal dilimler ship)*
3. **Usage anomaly alerts** — ani spike / sessizlik *(soft uyarılar ship)*
4. **Public status + incident subscribe** — güven *(T17: /durum e-posta + rozet/JSON docs ship)*
5. **Full MCP SDK server** — mevcut MCP-ish tools ötesi

### Ship edilmiş turlar
- T1–T6: forecast, Python SDK, kota alerts, HMAC, /docs/md, IP+version
- T7: remote deploy verify
- T8: latency insights
- T9: X-Request-Id / RateLimit-Reset / Request-Duration
- T10: error-rate analytics dashboard
- T11: `/mcp.json` + `/api/v1/agent/tools` + `/docs/mcp`
- T12: webhook failed/DLQ list + Yeniden dene UX
- T16: deprecation brownout (`API_BROWNOUT_*`, 503 + Retry-After)
- T17: `/durum` kesinti e-posta abonesi + SVG/JSON/Markdown durum gömme

### Sonraki
- T13+: SSO derinleştirme / Postman header örnekleri / status broadcast otomasyonu
