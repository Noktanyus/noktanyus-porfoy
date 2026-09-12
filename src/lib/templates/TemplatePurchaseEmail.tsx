/**
 * Template Purchase Email — Phase 3 B.4
 *
 * Gumroad / Lemon Squeezy / Stripe webhook'u basariyla islenip
 * TemplatePurchase + TemplateLicense kayitlari olusturulduktan sonra
 * aliciya gonderilen "satin alma basarili" mail'i.
 *
 * Subject: "Template satın alımınız başarılı"
 * Icerik: template adı, lisans anahtarı, download URL, kurulum adımları.
 *
 * NOT: Bu dosya server-side emailService.sendTemplatePurchase() tarafindan
 * render edilir. Client componentlerden import edilmez.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';
import { formatCurrency } from '@/lib/utils';

export interface TemplatePurchaseEmailProps {
  buyerName?: string;
  buyerEmail: string;
  templateName: string;
  templateSlug: string;
  licenseKey: string;
  licenseType: string;     // "single" | "white-label" | "agency"
  amountCents: number;
  currency: string;
  orderNumber: string;     // purchaseId veya externalId
  dashboardUrl: string;    // /dashboard/templates
  installUrl: string;      // /dashboard/templates/install?key=<license>
  source: string;          // "gumroad" | "lemonsqueezy" | "stripe" | "manual"
}

export default function TemplatePurchaseEmail({
  buyerName,
  buyerEmail,
  templateName,
  templateSlug,
  licenseKey,
  licenseType,
  amountCents,
  currency,
  orderNumber,
  dashboardUrl,
  installUrl,
  source,
}: TemplatePurchaseEmailProps) {
  const licenseLabel = licenseTypeDisplay(licenseType);
  const sourceLabel = sourceDisplay(source);

  return (
    <Html>
      <Head />
      <Preview>{templateName} template satin alma basarili</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Template Satin Aliminiz Basarili</Heading>
          <Text style={text}>
            Merhaba {buyerName?.trim() || 'Degerli Musterimiz'},
          </Text>
          <Text style={text}>
            {templateName} template&apos;ini basariyla satin aldiniz. Asagida
            lisans anahtariniz ve kurulum bilgileri yer alir.
          </Text>

          <Section style={box}>
            <Text style={meta}>{sourceLabel} · Siparis #{orderNumber}</Text>
            <Text style={productName}>{templateName}</Text>
            <Text style={meta}>
              {licenseLabel} · {formatCurrency(amountCents, currency)}
            </Text>
          </Section>

          <Heading style={h2}>Lisans Anahtariniz</Heading>
          <Section style={sLicenseBox}>
            <Text style={sLicenseLabel}>Template Slug</Text>
            <Text style={sLicenseSlug}>{templateSlug}</Text>
            <Hr style={sHrInner} />
            <Text style={sLicenseLabel}>Lisans Anahtari</Text>
            <Text style={sLicenseKey}>{licenseKey}</Text>
          </Section>

          <Text style={text}>
            Lisans anahtarinizi guvenli bir yere kaydedin. Kurulum sirasinda
            gerekli olacaktir.
          </Text>

          <Section style={buttonContainer}>
            <Button href={installUrl} style={buttonPrimary}>
              Hemen Kur
            </Button>
          </Section>

          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={buttonSecondary}>
              Lisanslarima Git
            </Button>
          </Section>

          <Heading style={h2}>Kurulum Adimlari</Heading>
          <Text style={text}>
            1. Dashboard&apos;unuzdan &quot;Lisanslarim&quot; sayfasina gidin.
          </Text>
          <Text style={text}>
            2. Lisans anahtarinizi kullanarak hedef workspace&apos;inize kurulumu baslatin.
          </Text>
          <Text style={text}>
            3. Kurulum birkac dakika icinde tamamlanir; hazir oldugunda size
            ikinci bir email gonderilecektir.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Bu email {buyerEmail} adresine gonderilmistir.
          </Text>
          <Text style={footer}>
            Sorunuz mu var?{' '}
            <Link href="/iletisim">Destek</Link> &middot;{' '}
            <Link href="/yasal/kvkk">KVKK Aydinlatma Metni</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function licenseTypeDisplay(type: string): string {
  switch (type) {
    case 'single':
      return 'Tek Domain Lisansi';
    case 'white-label':
      return 'White-Label Lisansi';
    case 'agency':
      return 'Agency Lisansi';
    default:
      return type;
  }
}

function sourceDisplay(source: string): string {
  switch (source) {
    case 'gumroad':
      return 'Gumroad';
    case 'lemonsqueezy':
      return 'Lemon Squeezy';
    case 'stripe':
      return 'Stripe';
    default:
      return source;
  }
}

// ===== Inline styles (email-safe) =====
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};
const h1 = {
  color: '#1a1a1a',
  fontSize: '26px',
  fontWeight: 'bold' as const,
  margin: '0 0 20px',
};
const h2 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600' as const,
  margin: '30px 0 12px',
};
const text = { color: '#333', fontSize: '14px', lineHeight: '24px', margin: '0 0 10px' };
const box = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};
const meta = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
};
const productName = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#1f2937',
  margin: '0 0 6px',
};
const sLicenseBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '6px',
  padding: '14px 18px',
  margin: '12px 0 20px',
};
const sLicenseLabel = {
  fontSize: '11px',
  color: '#92400e',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};
const sLicenseSlug = {
  fontSize: '14px',
  color: '#1f2937',
  fontFamily: 'monospace',
  margin: '0',
  wordBreak: 'break-all' as const,
};
const sLicenseKey = {
  fontSize: '15px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  fontFamily: 'monospace',
  margin: '0',
  wordBreak: 'break-all' as const,
};
const sHrInner = { borderColor: '#fbbf24', margin: '10px 0' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' };
const buttonContainer = { textAlign: 'center' as const, margin: '12px 0' };
const buttonPrimary = {
  backgroundColor: '#0078D4',
  color: '#ffffff',
  padding: '12px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600' as const,
  display: 'inline-block' as const,
};
const buttonSecondary = {
  backgroundColor: '#ffffff',
  color: '#0078D4',
  padding: '10px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: '600' as const,
  border: '1px solid #0078D4',
  display: 'inline-block' as const,
};
const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '6px 0',
};
