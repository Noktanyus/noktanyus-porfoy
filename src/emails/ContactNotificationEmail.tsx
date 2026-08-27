/**
 * İletişim Formu Bildirimi (Admin'e)
 *
 * Yeni contact form mesajı geldiğinde admin'e gönderilir.
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
} from '@react-email/components';

interface ContactNotificationProps {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
  adminUrl: string;
}

export default function ContactNotificationEmail({
  fromName,
  fromEmail,
  subject,
  message,
  adminUrl,
}: ContactNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Yeni iletişim mesajı: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Yeni Mesaj</Heading>
          <Text style={text}>
            <strong>{fromName}</strong> ({fromEmail}) yeni bir mesaj gönderdi:
          </Text>
          <Container style={messageBox}>
            <Text style={subjectStyle}>{subject}</Text>
            <Text style={messageStyle}>{message}</Text>
          </Container>
          <Button href={adminUrl} style={button}>
            Admin Panelinde Görüntüle
          </Button>
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
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0 0 20px',
};
const text = { color: '#333', fontSize: '14px', lineHeight: '24px', margin: '0 0 16px' };
const messageBox = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};
const subjectStyle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#1f2937',
  margin: '0 0 12px',
};
const messageStyle = {
  fontSize: '14px',
  color: '#4b5563',
  lineHeight: '22px',
  whiteSpace: 'pre-wrap' as const,
  margin: '0',
};
const button = {
  backgroundColor: '#0078D4',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: '600' as const,
  fontSize: '14px',
};