/**
 * Breach Notification Email Template (L8 / KVKK Madde 12 Aydınlatma)
 *
 * Etkilenen kullanıcılara gönderilen aydınlatma metni. KVKK Madde 12 uyumlu:
 *   - Net dilde, anlaşılır
 *   - Veri ihlali açıklaması (ne, ne zaman, etkilenen veri kategorileri)
 *   - İletişim bilgisi (veri sorumlusu)
 *   - Kullanıcı hakları (KVKK Madde 11)
 *   - Multi-language (TR default, EN opsiyonel)
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

export interface BreachNotificationEmailProps {
  locale?: 'tr' | 'en';
  recipientName?: string;
  workspaceName: string;
  breachTitle: string;
  breachDescription: string;
  detectedAt: Date;
  incidentId: string;
  affectedDataCategories?: string[];
  contactEmail: string;
  incidentUrl: string;
  /** KVKK Madde 11 kullanıcı hakları (her zaman listelenir) */
  userRights?: string[];
}

const TR_RIGHTS = [
  'Kişisel verilerinizin işlenip işlenmediğini öğrenme',
  'İşlenmişse buna ilişkin bilgi talep etme',
  'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme',
  'Yurt içinde/dışında aktarıldığı 3. tarafları öğrenme',
  'Eksik/yanlış işlenen verilerin düzeltilmesini isteme',
  'Şartlar oluştuğunda silinmesini/yok edilmesini isteme',
];

const EN_RIGHTS = [
  'Learn whether your personal data is processed',
  'Request information about processing activities',
  'Learn the purpose of processing and whether it is used accordingly',
  'Learn third parties to whom data is transferred domestically/abroad',
  'Request correction of incomplete/incorrect data',
  'Request deletion/destruction of data under applicable conditions',
];

export function BreachNotificationEmail({
  locale = 'tr',
  recipientName,
  workspaceName,
  breachTitle,
  breachDescription,
  detectedAt,
  incidentId,
  affectedDataCategories,
  contactEmail,
  incidentUrl,
  userRights,
}: BreachNotificationEmailProps) {
  const isTr = locale === 'tr';
  const rights = userRights ?? (isTr ? TR_RIGHTS : EN_RIGHTS);

  return (
    <Html>
      <Head />
      <Preview>
        {isTr
          ? `[ÖNEMLİ] ${workspaceName} — Veri İhlali Bildirimi`
          : `[IMPORTANT] ${workspaceName} — Data Breach Notification`}
      </Preview>
      <Body
        style={{
          backgroundColor: '#f8fafc',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          margin: 0,
          padding: '32px 16px',
        }}
      >
        <Container
          style={{
            maxWidth: '600px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '32px',
            margin: '0 auto',
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '16px',
              borderRadius: '4px',
              marginBottom: '24px',
            }}
          >
            <Heading
              as="h1"
              style={{
                color: '#ffffff',
                fontSize: '18px',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {isTr ? 'VERİ İHLALİ BİLDİRİMİ' : 'DATA BREACH NOTIFICATION'}
            </Heading>
          </Section>

          {/* Greeting */}
          <Text style={{ fontSize: '14px', color: '#1e293b', marginTop: 0 }}>
            {isTr
              ? `Sayın ${recipientName ?? 'kullanıcı'},`
              : `Dear ${recipientName ?? 'user'},`}
          </Text>

          {/* Body */}
          <Text style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
            {isTr
              ? `6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 12. maddesi kapsamında, ${workspaceName} bünyesinde gerçekleşen bir veri ihlalini sizinle paylaşmak istiyoruz.`
              : `In compliance with Article 12 of the Personal Data Protection Law No. 6698, we are notifying you of a data breach that occurred within ${workspaceName}.`}
          </Text>

          <Heading
            as="h2"
            style={{ fontSize: '16px', color: '#0f172a', marginTop: '24px' }}
          >
            {breachTitle}
          </Heading>

          <Text
            style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}
          >
            {breachDescription}
          </Text>

          <Hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />

          {/* Detay tablosu */}
          <Section>
            <table
              style={{
                width: '100%',
                fontSize: '13px',
                borderCollapse: 'collapse',
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: '6px 0',
                      color: '#64748b',
                      width: '40%',
                    }}
                  >
                    {isTr ? 'Veri Sorumlusu' : 'Data Controller'}
                  </td>
                  <td style={{ padding: '6px 0', color: '#1e293b' }}>
                    {workspaceName}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}>
                    {isTr ? 'Tespit Tarihi' : 'Detected At'}
                  </td>
                  <td style={{ padding: '6px 0', color: '#1e293b' }}>
                    {detectedAt.toISOString()}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}>
                    {isTr ? 'Olay No' : 'Incident ID'}
                  </td>
                  <td
                    style={{
                      padding: '6px 0',
                      color: '#1e293b',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  >
                    {incidentId}
                  </td>
                </tr>
                {affectedDataCategories && affectedDataCategories.length > 0 && (
                  <tr>
                    <td style={{ padding: '6px 0', color: '#64748b' }}>
                      {isTr ? 'Etkilenen Veriler' : 'Affected Data'}
                    </td>
                    <td style={{ padding: '6px 0', color: '#1e293b' }}>
                      {affectedDataCategories.join(', ')}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b' }}>
                    {isTr ? 'İletişim' : 'Contact'}
                  </td>
                  <td style={{ padding: '6px 0', color: '#1e293b' }}>
                    {contactEmail}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />

          {/* User Rights */}
          <Heading
            as="h3"
            style={{ fontSize: '14px', color: '#0f172a', marginTop: 0 }}
          >
            {isTr
              ? 'KVKK Madde 11 Kapsamındaki Haklarınız'
              : 'Your Rights Under Article 11'}
          </Heading>
          <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#334155' }}>
            {rights.map((right, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {right}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Section style={{ textAlign: 'center', margin: '32px 0 16px' }}>
            <Button
              href={incidentUrl}
              style={{
                backgroundColor: '#1e40af',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                padding: '12px 24px',
                borderRadius: '4px',
                textDecoration: 'none',
              }}
            >
              {isTr ? 'İhlal Detayını Görüntüle' : 'View Incident Details'}
            </Button>
          </Section>

          <Hr style={{ margin: '24px 0', borderColor: '#e2e8f0' }} />

          <Text
            style={{
              fontSize: '11px',
              color: '#64748b',
              textAlign: 'center',
              margin: 0,
            }}
          >
            {isTr
              ? 'Bu e-posta KVKK Madde 12 aydınlatma yükümlülüğü kapsamında gönderilmiştir.'
              : 'This email is sent in compliance with Article 12 of the KVKK.'}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default BreachNotificationEmail;
