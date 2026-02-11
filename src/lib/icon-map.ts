/**
 * @file Merkezi İkon Haritası (Fuzzy Search Destekli)
 * @description Proje genelinde kullanılacak tüm `react-icons` ikonlarını
 *              ve "akıllı bulma" mantığını içerir. Levenshtein mesafesi
 *              kullanarak yazım yanlışlarına tolerans gösterir.
 */
import { ElementType } from 'react';
// İkonları import et (Doğrulanmış ve geçerli liste)
import {
  FaReact, FaNodeJs, FaHtml5, FaCss3Alt, FaJsSquare, FaPython, FaJava, FaPhp, FaGitAlt, FaDocker, FaSass, FaLess, FaWordpress, FaVuejs, FaAngular, FaSwift, FaFigma, FaCode, FaDatabase, FaServer, FaLinux, FaWindows, FaApple, FaAndroid,
} from 'react-icons/fa';
import {
  SiTypescript, SiPrisma, SiNextdotjs, SiPostgresql, SiMysql, SiMongodb, SiRedis, SiGraphql, SiExpress, SiNestjs, SiDjango, SiFlask, SiKotlin, SiGo, SiRust, SiKubernetes, SiTerraform, SiVercel, SiNetlify, SiTailwindcss, SiBootstrap, SiJquery, SiRedux, SiWebpack, SiBabel, SiEslint, SiJest, SiCypress, SiStorybook, SiPostman, SiSwagger, SiSocketdotio, SiDotnet, SiMicrosoft,
} from 'react-icons/si';
import { TbBrandCSharp } from 'react-icons/tb';

export const iconComponents: { [key: string]: ElementType } = {
  FaReact, FaNodeJs, FaHtml5, FaCss3Alt, FaJsSquare, FaPython, FaJava, FaPhp, FaGitAlt, FaDocker, FaSass, FaLess, FaWordpress, FaVuejs, FaAngular, FaSwift, FaFigma, FaCode, FaDatabase, FaServer, FaLinux, FaWindows, FaApple, FaAndroid,
  SiTypescript, SiPrisma, SiNextdotjs, SiPostgresql, SiMysql, SiMongodb, SiRedis, SiGraphql, SiExpress, SiNestjs, SiDjango, SiFlask, SiKotlin, SiGo, SiRust, SiKubernetes, SiTerraform, SiVercel, SiNetlify, SiTailwindcss, SiBootstrap, SiJquery, SiRedux, SiWebpack, SiBabel, SiEslint, SiJest, SiCypress, SiStorybook, SiPostman, SiSwagger, SiSocketdotio, SiDotnet, SiMicrosoft,
  TbBrandCSharp,
};

// Arama için normalize edilmiş bir anahtar listesi oluştur
const normalizedIconKeys = Object.keys(iconComponents).map(iconName => 
  iconName.replace(/^(Fa|Si)/, '').toLowerCase()
);
const iconKeyMap = new Map(Object.keys(iconComponents).map(iconName => [
    iconName.replace(/^(Fa|Si)/, '').toLowerCase(),
    iconName
]));


/**
 * İki string arasındaki Levenshtein mesafesini hesaplar.
 * @param s1 Birinci string
 * @param s2 İkinci string
 * @returns Aralarındaki düzenleme mesafesi (sayı)
 */
function levenshteinDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = new Array(s2.length + 1);
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Verilen bir teknoloji adına göre en uygun ikon adını bulur (fuzzy search).
 * @param techName - Aranacak teknoloji adı (örn: "pyp")
 * @returns En yakın eşleşen ikonun adı (örn: "FaPhp") veya null.
 */
export const findIcon = (techName: string): string | null => {
  if (!techName || techName.trim().length < 2) return null;
  const normalizedTechName = techName.toLowerCase().replace(/\s/g, '').replace(/\./g, 'dot');

  let bestMatch: string | null = null;
  let minDistance = Infinity;

  // Birebir eşleşme en yüksek önceliğe sahip
  const directMatchKey = iconKeyMap.get(normalizedTechName);
  if (directMatchKey) {
      return directMatchKey;
  }

  // Fuzzy search
  for (const key of normalizedIconKeys) {
    const distance = levenshteinDistance(normalizedTechName, key);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = key;
    }
  }

  // Eşik değeri: Eğer en yakın kelime bile çok alakasızsa, önerme.
  // Kelime uzunluğunun yarısından az bir mesafe makul bir eşiktir.
  if (bestMatch && minDistance <= Math.floor(normalizedTechName.length / 2)) {
    return iconKeyMap.get(bestMatch) || null;
  }

  return null;
};
