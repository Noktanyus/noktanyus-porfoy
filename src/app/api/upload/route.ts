/**
 * @file Genel amaçlı resim yükleme API rotası.
 * @description Bu rota, istemciden gelen bir resim dosyasını alır, sunucudaki
 *              `public/images` klasörüne kaydeder ve resmin URL'sini döndürür.
 *              NOT: Bu rota, `api/admin/upload` rotası ile neredeyse aynı işlevi
 *              yerine getirmektedir ve kimlik doğrulaması içermemektedir. Bu durum
 *              bir güvenlik açığı oluşturabilir. Proje genelinde tutarlılık ve
 *              güvenlik için bu rotanın `api/admin/upload` ile birleştirilmesi
 *              veya kaldırılması şiddetle tavsiye edilir.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: "Yüklenecek dosya bulunamadı." });
  }

  // Dosyayı buffer'a oku
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Dosya uzantısını al ve benzersiz bir dosya adı oluştur
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  
  // Dosyayı `public/images` dizinine kaydet
  const path = join(process.cwd(), 'public/images', fileName);
  try {
    await writeFile(path, buffer);
    console.log(`Dosya başarıyla yüklendi: ${path}`);

    // Başarılı yanıtı ve resmin URL'sini döndür
    return NextResponse.json({ success: true, imageUrl: `/images/${fileName}` });
  } catch (error) {
    console.error("Dosya yazma hatası:", error);
    return NextResponse.json({ success: false, error: "Dosya sunucuya kaydedilirken bir hata oluştu." }, { status: 500 });
  }
}
