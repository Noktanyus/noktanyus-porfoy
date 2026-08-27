/**
 * Hoş Geldiniz Email Template
 *
 * Yeni müşteri kaydı sonrası gönderilir.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
  Link,
} from '@react-email/components';

interface WelcomeEmailProps {
  name?: string;
  loginUrl: string;
}

export default function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Hoş geldiniz!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hoş Geldiniz!</Heading>
          <Text style={text}>Merhaba {name ?? 'Değerli Müşterimiz'},</Text>
          <Text style={text}>
            Hesabınız başarıyla oluşturuldu. Artık tüm dijital ürünlerimize ve hizmetlerimize
            erişebilirsiniz.
          </Text>
          <Button href={loginUrl} style={button}>
            Giriş Yap
          </Button>
          <Text style={footer}>
            Sorularınız için{' '}
            <Link href="mailto:destek@noktanyus.com">destek@noktanyus.com</Link> adresinden
            bize ulaşabilirsiniz.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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
const text = { color: '#333', fontSize: '14px', lineHeight: '24px', margin: '0 0 16px' };
const button = {
  backgroundColor: '#0078D4',
  color: '#ffffff',
  padding: '12px 32px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: '600' as const,
  fontSize: '14px',
  margin: '16px 0',
};
const footer = { color: '#9ca3af', fontSize: '12px', margin: '32px 0 0' };