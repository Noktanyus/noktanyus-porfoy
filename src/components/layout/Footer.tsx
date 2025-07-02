/**
 * @file Sitenin altbilgi (footer) bölümünü oluşturan bileşen.
 * @description Bu bileşen, sosyal medya bağlantılarını ve telif hakkı bilgisini içerir.
 *              Sosyal medya linkleri, merkezi içerik yönetiminden dinamik olarak alınır.
 */

import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { getAboutData } from '@/lib/content-parser';

const Footer = async () => {
  // Sosyal medya bilgilerini merkezi yapılandırma dosyasından al
  const aboutData = await getAboutData();
  const { social } = aboutData;

  return (
    <footer className="bg-light-bg dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400">
        <div className="flex justify-center space-x-6 mb-4">
          {social.github && (
            <a 
              href={social.github} 
              aria-label="GitHub profilim" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-light-text dark:hover:text-white transition-colors"
            >
              <FaGithub size={24} />
            </a>
          )}
          {social.linkedin && (
            <a 
              href={social.linkedin} 
              aria-label="LinkedIn profilim" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-light-text dark:hover:text-white transition-colors"
            >
              <FaLinkedin size={24} />
            </a>
          )}
          {social.twitter && (
            <a 
              href={social.twitter} 
              aria-label="Twitter profilim" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-light-text dark:hover:text-white transition-colors"
            >
              <FaTwitter size={24} />
            </a>
          )}
        </div>
        <p>&copy; {new Date().getFullYear()} {aboutData.name || "Portföyüm"}. Tüm Hakları Saklıdır.</p>
      </div>
    </footer>
  );
};

export default Footer;
