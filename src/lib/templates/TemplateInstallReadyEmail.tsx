/**
 * Template Install Ready Email — Phase 3 B.4
 *
 * Worker (BullMQ) template kurulumunu tamamladiginda aliciya gonderilen
 * "deploy tamamlandi" mail'i. installation row 'ready' durumuna gectikten
 * sonra tetiklenir.
 *
 * Subject: "Template deploy tamamlandı"
 * Icerik: deployed URL, admin credentials info, sonraki adimlar.
 *
 * NOT: Bu dosya server-side emailService.sendTemplateInstallReady() tarafindan
 * render edilir. Client componentlerden import edilmez.
 *
 * Admin credentials bilincli olarak email'de tam olarak gonderilmez —
 * sadece "ilk giris sirasinda sifre sifirlama linki gonderilecek" notu vardir.
 * Production'da random password console'a loglanir veya secret manager'a yazilir.
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

export interface TemplateInstallReadyEmailProps {
  buyerName?: string;
  buyerEmail: string;
  templateName: string;
  templateSlug: string;
  workspaceName: string;
  deployedUrl: string;
  githubRepoUrl?: string;
  adminLoginUrl: string;     // deployedUrl + /admin veya benzeri
  supportEmail?: string;
}

export default function TemplateInstallReadyEmail({
  buyerName,
  buyerEmail,
  templateName,
  templateSlug,
  workspaceName,
  deployedUrl,
  githubRepoUrl,
  adminLoginUrl,
  supportEmail,
}: TemplateInstallReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{templateName} deploy basariyla tamamlandi</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Template Deploy Tamamlandi</Heading>
          <Text style={text}>
            Merhaba {buyerName?.trim() || 'Degerli Musterimiz'},
          </Text>
          <Text style={text}>
            <strong>{templateName}</strong> template&apos;i{' '}
            <strong>{workspaceName}</strong> workspace&apos;inize basariyla
            kuruldu ve yayina alindi.
          </Text>

          <Section style={box}>
            <Text style={meta}>DEPLOY URL</Text>
            <Text style={link}>{deployedUrl}</Text>
            <Hr style={hrInner} />
            <Text style={meta}>WORKSPACE</Text>
            <Text style={value}>{workspaceName}</Text>
            <Hr style={hrInner} />
            <Text style={meta}>TEMPLATE</Text>
            <Text style={value}>{templateName} ({templateSlug})</Text>
            {githubRepoUrl && (
              <>
                <Hr style={hrInner} />
                <Text style={meta}>GITHUB REPO</Text>
                <Text style={link}>{githubRepoUrl}</Text>
              </>
            )}
          </Section>

          <Heading style={h2}>Yonetici Erisimi</Heading>
          <Text style={text}>
            Admin paneline erisim icin asagidaki butonu kullanin. Ilk giris
            sirasinda sistem size sifre sifirlama baglantisi gonderecektir;
            gucunlu bir sifre belirleyip devam edebilirsiniz.
          </Text>
          <Section style={buttonContainer}>
            <Button href={adminLoginUrl} style={buttonPrimary}>
              Admin Paneline Git
            </Button>
          </Section>
          <Section style={buttonContainer}>
            <Button href={deployedUrl} style={buttonSecondary}>
              Siteyi Goruntule
            </Button>
          </Section>

          <Heading style={h2}>Sonraki Adimlar</Heading>
          <Text style={text}>
            1. Admin paneline giris yaparak site ayarlarinizi (marka, icerik,
            domain) ozellestirin.
          </Text>
          <Text style={text}>
            2. Kendi domain&apos;inizi baglamak icin &quot;Custom Domain&quot;
            sayfasindaki DNS talimatlarini izleyin.
          </Text>
          <Text style={text}>
            3. White-label lisansiniz varsa marka logonuzu ve renklerinizi
            tema ayarlarindan degistirebilirsiniz.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Bu email {buyerEmail} adresine gonderilmistir.
          </Text>
          <Text style={footer}>
            Yardim mi lazim?{' '}
            {supportEmail ? (
              <Link href={`mailto:${supportEmail}`}>{supportEmail}</Link>
            ) : (
              <Link href="/iletisim">Destek</Link>
            )}
            {' · '}
            <Link href="/yasal/kvkk">KVKK Aydinlatma Metni</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
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
  backgroundColor: '#ecfdf5',
  border: '1px solid #10b981',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
};
const meta = {
  fontSize: '11px',
  color: '#065f46',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};
const value = {
  fontSize: '14px',
  color: '#1f2937',
  margin: '0',
  wordBreak: 'break-word' as const,
};
const link = {
  fontSize: '14px',
  color: '#0078D4',
  textDecoration: 'underline',
  margin: '0',
  wordBreak: 'break-all' as const,
};
const hrInner = { borderColor: '#10b981', margin: '10px 0' };
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' };
const buttonContainer = { textAlign: 'center' as const, margin: '12px 0' };
const buttonPrimary = {
  backgroundColor: '#10b981',
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
