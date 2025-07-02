/**
 * @file Popup'lar için temel CRUD işlemlerini yöneten API rotası.
 * @description Bu dosya, tüm popup'ları listelemek (GET), yeni bir popup
 *              oluşturmak veya güncellemek (POST) ve bir popup'ı silmek (DELETE)
 *              için kullanılır. Bu rota, doğrudan dosya sistemi üzerinde çalışır
 *              ve yönetim panelindeki `content` API'sine bir alternatiftir.
 *              NOT: Bu rota, projenin başka bir bölümünde `api/admin/content` rotası
 *              ile benzer işlevleri yerine getirdiği için kod tekrarı oluşturmaktadır.
 *              Proje genelinde tutarlılık için bu rotaların birleştirilmesi önerilir.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Popup } from '@/types/content';

// Popup JSON dosyalarının bulunduğu dizin
const contentDirectory = path.join(process.cwd(), 'content', 'popups');

/**
 * Belirtilen dosya yolunun ait olduğu dizinin var olduğundan emin olur.
 * Dizin yoksa, rekürsif olarak oluşturur.
 * @param filePath - Kontrol edilecek dosyanın yolu.
 */
const ensureDirectoryExistence = (filePath: string) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

/**
 * GET: Tüm popup'ları listeler.
 */
export async function GET() {
  try {
    const fileNames = fs.readdirSync(contentDirectory);
    const popups = fileNames
      .filter(fileName => fileName.endsWith('.json'))
      .map(fileName => {
        const fullPath = path.join(contentDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(fileContents);
        return {
          slug: fileName.replace(/\.json$/, ''), // Dosya adından .json uzantısını kaldırarak slug oluştur
          ...data,
        };
      });
    return NextResponse.json(popups);
  } catch (error) {
    console.error("Popup listeleme hatası:", error);
    return NextResponse.json({ message: "Popup'lar getirilirken sunucuda bir hata oluştu." }, { status: 500 });
  }
}

/**
 * POST: Yeni bir popup oluşturur veya mevcut birini günceller.
 */
export async function POST(request: Request) {
  try {
    const popupData: Popup = await request.json();
    
    // Gelen veride 'slug' alanı olup olmadığını kontrol et
    if (!popupData || !popupData.slug) {
      return NextResponse.json({ message: 'Eksik veya geçersiz veri: `slug` alanı zorunludur.' }, { status: 400 });
    }

    const filePath = path.join(contentDirectory, `${popupData.slug}.json`);
    const fileContent = JSON.stringify(popupData, null, 2); // JSON'u okunaklı formatta string'e çevir

    ensureDirectoryExistence(filePath); // Dizin'in var olduğundan emin ol
    fs.writeFileSync(filePath, fileContent); // Dosyayı yaz (varsa üzerine yazar)

    return NextResponse.json({ message: 'Popup başarıyla kaydedildi.' }, { status: 201 });

  } catch (error) {
    console.error("Popup oluşturma/güncelleme hatası:", error);
    return NextResponse.json({ message: 'Popup kaydedilirken sunucuda bir hata oluştu.' }, { status: 500 });
  }
}

/**
 * DELETE: Belirtilen bir popup'ı siler.
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        if (!slug) {
            return NextResponse.json({ message: 'Silinecek popup için `slug` parametresi eksik.' }, { status: 400 });
        }

        const filePath = path.join(contentDirectory, `${slug}.json`);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ message: 'Belirtilen popup bulunamadı.' }, { status: 404 });
        }

        fs.unlinkSync(filePath); // Dosyayı sil

        return NextResponse.json({ message: 'Popup başarıyla silindi.' });

    } catch (error) {
        console.error("Popup silme hatası:", error);
        return NextResponse.json({ message: 'Popup silinirken sunucuda bir hata oluştu.' }, { status: 500 });
    }
}
