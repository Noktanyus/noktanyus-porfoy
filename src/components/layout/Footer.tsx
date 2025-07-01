import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-light-bg dark:bg-dark-card border-t border-gray-200 dark:border-dark-border mt-12">
      <div className="container mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400">
        <div className="flex justify-center space-x-6 mb-4">
          <a href="#" aria-label="GitHub" className="hover:text-light-text dark:hover:text-white transition-colors"><FaGithub size={24} /></a>
          <a href="#" aria-label="LinkedIn" className="hover:text-light-text dark:hover:text-white transition-colors"><FaLinkedin size={24} /></a>
          <a href="#" aria-label="Twitter" className="hover:text-light-text dark:hover:text-white transition-colors"><FaTwitter size={24} /></a>
        </div>
        <p>&copy; {new Date().getFullYear()} Portföyüm. Tüm Hakları Saklıdır.</p>
      </div>
    </footer>
  );
};

export default Footer;