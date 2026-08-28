/**
 * Sipariş Onayı Email Template
 *
 * Ödeme başarılı olduğunda müşteriye gönderilen receipt.
 * Lisans anahtarlarını (varsa) içerir.
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

interface ReceiptEmailProps {
  customerName?: string;
  customerEmail: string;
  orderNumber: string;
  items: Array<{
    title: string;
    quantity: number;
    priceCents: number;
  }>;
  totalCents: number;
  currency: string;
  licenses?: Array<{ key: string; productTitle: string }>;
  dashboardUrl: string;
}

export default function ReceiptEmail({
  customerName,
  customerEmail,
  orderNumber,
  items,
  totalCents,
  currency,
  licenses = [],
  dashboardUrl,
}: ReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Siparişiniz alındı: {orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sipariş Onayı</Heading>
          <Text style={text}>Merhaba {customerName ?? 'Değerli Müşterimiz'},</Text>
          <Text style={text}>
            Siparişiniz başarıyla alındı. Sipariş detayları aşağıdadır:
          </Text>

          <Section style={orderBox}>
            <Text style={orderNumberStyle}>#{orderNumber}</Text>

            {items.map((item, idx) => (
              <Section key={idx} style={itemRow}>
                <Text style={itemTitle}>{item.title}</Text>
                <Text style={itemQty}>x{item.quantity}</Text>
                <Text style={itemPrice}>
                  {formatCurrency(item.priceCents * item.quantity, currency)}
                </Text>
              </Section>
            ))}

            <Hr style={hr} />
            <Section style={totalRow}>
              <Text style={totalLabel}>Toplam:</Text>
              <Text style={totalAmount}>{formatCurrency(totalCents, currency)}</Text>
            </Section>
          </Section>

          {licenses.length > 0 && (
            <>
              <Heading style={h2}>Lisans Anahtarlarınız</Heading>
              {licenses.map((lic, idx) => (
                <Section key={idx} style={licenseBox}>
                  <Text style={licenseProduct}>{lic.productTitle}</Text>
                  <Text style={licenseKey}>{lic.key}</Text>
                </Section>
              ))}
              <Text style={text}>
                Lisans anahtarlarınızı güvenli bir yere kaydedin. Dashboard&apos;unuzdan da
                erişebilirsiniz.
              </Text>
            </>
          )}

          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              Dashboard&apos;a Git
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Bu e-posta {customerEmail} adresine gönderilmiştir.</Text>
          <Text style={footer}>
            <Link href="/yasal/kvkk">KVKK Aydınlatma Metni</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Inline styles (email-safe)
const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
};
const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0 0 20px',
};
const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: '600' as const,
  margin: '30px 0 15px',
};
const text = { color: '#333', fontSize: '14px', lineHeight: '24px', margin: '0 0 12px' };
const orderBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};
const orderNumberStyle = {
  fontSize: '12px',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 16px',
};
const itemRow = {
  margin: '8px 0',
};
const itemTitle = { fontSize: '14px', color: '#1f2937', margin: '0' };
const itemQty = { fontSize: '14px', color: '#6b7280', margin: '4px 0' };
const itemPrice = { fontSize: '14px', color: '#1f2937', margin: '4px 0' };
const hr = { borderColor: '#e5e7eb', margin: '16px 0' };
const totalRow = { margin: '8px 0' };
const totalLabel = { fontSize: '16px', fontWeight: '600' as const, margin: '0' };
const totalAmount = {
  fontSize: '20px',
  fontWeight: 'bold' as const,
  color: '#059669',
  margin: '4px 0 0',
};
const licenseBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '6px',
  padding: '12px',
  margin: '8px 0',
  fontFamily: 'monospace',
};
const licenseProduct = { fontSize: '12px', color: '#92400e', margin: '0 0 4px' };
const licenseKey = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0',
};
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' };
const button = {
  backgroundColor: '#0078D4',
  color: '#ffffff',
  padding: '12px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '600' as const,
};
const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '8px 0',
};