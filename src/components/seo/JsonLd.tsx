/**
 * @file JSON-LD yapısal veri script bileşeni.
 * @description Server component olarak çalışır. Head bölümünde `<script type="application/ld+json">`
 *              etiketiyle Schema.org yapısal verisi basar. Google ve diğer arama motorları
 *              içeriği anlamlandırmak için bu veriyi kullanır.
 *
 *              Kullanım:
 *              ```tsx
 *              <JsonLd data={articleJsonLd({ ... })} />
 *              ```
 *
 *              Birden fazla schema'yı birlikte basmak için ikinci parametre olarak
 *              dizi verilebilir (Google spec uyumu için virgülle ayrılmaz,
 *              her şema ayrı <script> bloğuna basılır).
 */

export function JsonLd<T extends object>({ data }: { data: T | T[] }) {
  // String parse/JSON-MD hatalarını önlemek için tüm undefined değerleri siliyoruz.
  const stripUndefined = (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
      return obj
        .map(stripUndefined)
        .filter((v) => v !== undefined && v !== null);
    }
    if (obj && typeof obj === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        const cleanedVal = stripUndefined(v);
        if (
          cleanedVal !== undefined &&
          cleanedVal !== null &&
          cleanedVal !== '' &&
          !(Array.isArray(cleanedVal) && cleanedVal.length === 0)
        ) {
          cleaned[k] = cleanedVal;
        }
      }
      return cleaned;
    }
    return obj;
  };

  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, idx) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={`jsonld-${idx}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(stripUndefined(item)).replace(
              // Google spec uyarısı: "application/ld+json" içinde </script> olamaz.
              /</g,
              '\\u003c',
            ),
          }}
        />
      ))}
    </>
  );
}

// Yeniden export — sayfa componentleri doğrudan kullanabilsin
export {
  articleJsonLd,
  productJsonLd,
  personJsonLd,
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  faqJsonLd,
  generateOpenGraph,
  generateTwitterCard,
  generateMetadata,
  getBaseUrl,
} from '@/lib/seo';
