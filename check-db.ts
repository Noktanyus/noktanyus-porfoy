// portfoy1/check-db.ts
import { checkDatabaseConnection } from './src/lib/prisma';

console.log('Build öncesi veritabanı bağlantısı kontrol ediliyor...');
checkDatabaseConnection().then(() => {
  console.log('Veritabanı kontrolü başarıyla tamamlandı.');
});
