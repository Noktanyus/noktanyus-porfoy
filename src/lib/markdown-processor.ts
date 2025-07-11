/**
 * @file Merkezi Markdown İşlemcisi
 * @description Bu modül, remark/rehype ekosistemini kullanarak projede tutarlı
 *              bir Markdown'dan HTML'e dönüşüm süreci sağlar. GFM (tablolar,
 *              üstü çizili metin vb.), güvenlik (HTML temizleme) ve kod blokları
 *              için sözdizimi vurgulama gibi özellikler burada merkezi olarak
 *              yapılandırılmıştır.
 */

import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

/**
 * Verilen bir Markdown metnini güvenli ve stillendirilmiş HTML'e dönüştürür.
 * Bu fonksiyon, projenin hem sunucu tarafı (içerik oluşturma) hem de
 * istemci tarafı (editör önizlemesi) için tek gerçeklik kaynağıdır.
 *
 * @param markdownContent İşlenecek Markdown metni.
 * @returns {Promise<string>} İşlenmiş ve güvenli HTML dizesi.
 */
export async function processMarkdown(markdownContent: string): Promise<string> {
  const result = await remark()
    // 1. GFM (GitHub Flavored Markdown) desteğini etkinleştir.
    //    Bu, tablolar, görev listeleri, üstü çizili metin gibi özellikleri ekler.
    .use(remarkGfm)
    
    // 2. Remark (Markdown AST) -> Rehype (HTML AST) dönüşümünü yap.
    //    Bu, HTML tabanlı eklentilerin çalışabilmesi için gereklidir.
    .use(remarkRehype)
    
    // 3. Kod bloklarına sözdizimi vurgulaması uygula.
    //    'rehype-highlight' kütüphanesi 'highlight.js'i kullanır.
    //    CSS temasını ayrıca projeye dahil etmeyi unutma!
    .use(rehypeHighlight)
    
    // 4. HTML'i güvenlik açıklarına karşı temizle (Sanitize).
    //    Bu, XSS gibi saldırıları önlemek için kritik öneme sahiptir.
    //    Varsayılan yapılandırma çoğu tehlikeli etiketi (örn: <script>) kaldırır.
    .use(rehypeSanitize)
    
    // 5. Rehype (HTML AST) -> HTML metnine dönüştür.
    .use(rehypeStringify)
    
    // Verilen içeriği işle.
    .process(markdownContent);

  return result.toString();
}
