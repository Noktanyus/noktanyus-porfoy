import { Metadata } from 'next';
import EmailMxToolClient from '@/components/tools/EmailMxToolClient';

export const metadata: Metadata = {
  title: 'E-posta MX Doğrulama | Noktanyus',
  description:
    'E-posta formatı ve MX DNS kaydı kontrolü. API: /api/v1/validate/email',
  alternates: {
    canonical: 'https://noktanyus.com/araclar/email-mx',
  },
  openGraph: {
    title: 'E-posta MX Doğrulama | Noktanyus',
    description: 'Ücretsiz e-posta MX kontrolü + validate API.',
    url: 'https://noktanyus.com/araclar/email-mx',
  },
};

export default function EmailMxPage() {
  return <EmailMxToolClient />;
}
