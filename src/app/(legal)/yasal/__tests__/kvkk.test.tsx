import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KvkkPage from '@/app/(legal)/yasal/kvkk/page';

describe('KVKK Page', () => {
  it('renders the title', () => {
    render(<KvkkPage />);
    expect(screen.getByRole('heading', { level: 1, name: /KVKK Aydınlatma Metni/i })).toBeInTheDocument();
  });

  it('mentions KVKK Madde 11', () => {
    render(<KvkkPage />);
    expect(screen.getByText(/KVKK Madde 11/i)).toBeInTheDocument();
  });

  it('includes all main sections', () => {
    render(<KvkkPage />);
    expect(screen.getByRole('heading', { level: 2, name: /1\. Veri Sorumlusu/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /2\. Toplanan Kişisel Veriler/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /3\. İşleme Amaçları/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /4\. Verilerin Aktarımı/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /5\. Veri Saklama Süresi/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /7\. Başvuru Yöntemi/i })).toBeInTheDocument();
  });

  it('includes contact email', () => {
    render(<KvkkPage />);
    const link = screen.getByRole('link', { name: /info@noktanyus.com/i });
    expect(link).toHaveAttribute('href', 'mailto:info@noktanyus.com');
  });

  it('renders last-updated label in Turkish', () => {
    render(<KvkkPage />);
    expect(screen.getByText(/Son güncelleme:/i)).toBeInTheDocument();
  });
});
