/**
 * Audit Report Layout — React PDF Document (Phase 4 C.5)
 *
 * @react-pdf/renderer Document bileşeni. Cover page + Summary + Cookies +
 * Tracking scripts + Forms + Threats + Footer. pdfExport.ts içindeki
 * generateAuditReport tarafından renderToBuffer ile Buffer'a dönüştürülür.
 *
 * Pattern:
 *   - @react-pdf/renderer: Document, Page, Text, View, StyleSheet, Image
 *   - Workspace logo opsiyonel; CvData shape = pdfExport.ts input
 *
 * NOT: Bu dosya server-side React PDF renderer tarafından çalıştırılır.
 * Browser React'i değil; @react-pdf/renderer'ın kendi React renderer'ı
 * kullanılır (jsx target = "react").
 */

import * as React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// ============================================================================
// Public types — pdfExport.ts ile paylaşılır
// ============================================================================

export interface AuditReportCv {
  /** Workspace adı (cover page başlığı). */
  workspaceName: string;
  /** Workspace logo URL (opsiyonel). */
  workspaceLogoUrl?: string | null;
  /** ComplianceSite.domain (örn: "example.com"). */
  domain: string;
  /** Site adı. */
  siteName: string;
  /** Rapor oluşturulma tarihi (ISO string). */
  reportDate: string;
  /** Scan başlangıç tarihi (ISO string). */
  scanDate: string;
  /** Compliance skoru (0-100). */
  score: number;
  /** Sayfa sayısı. */
  pagesScanned: number;
  /** Tarama süresi (ms). */
  durationMs: number;
  /** Threat sayıları — severity bazında. */
  threatCounts: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  /** Toplam threat sayısı. */
  totalThreats: number;
  /** Cookie kayıtları. */
  cookies: Array<{
    name: string;
    provider?: string | null;
    type: string;
    duration?: string | null;
  }>;
  /** Tracking script kayıtları. */
  trackingScripts: Array<{
    url: string;
    provider: string;
    knownTracker?: string | null;
    gdprCompliant: boolean;
  }>;
  /** Form kayıtları. */
  forms: Array<{
    url: string;
    method: string;
    fieldsCount: number;
    consentRequired: boolean;
  }>;
  /** Threat detayları. */
  threats: Array<{
    severity: string;
    type: string;
    description: string;
    regulationRef?: string | null;
    fixSuggestion?: string | null;
    pageUrl?: string | null;
  }>;
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    backgroundColor: '#ffffff',
  },
  coverPage: {
    padding: 0,
    fontFamily: 'Helvetica',
  },
  coverInner: {
    padding: 60,
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  coverTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 80,
  },
  coverLogo: {
    width: 56,
    height: 56,
    marginRight: 14,
    objectFit: 'contain',
  },
  coverBrand: {
    fontSize: 14,
    color: '#cbd5e1',
    letterSpacing: 2,
  },
  coverTitleBlock: {
    marginBottom: 80,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#ffffff',
  },
  coverSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 4,
  },
  coverDomain: {
    fontSize: 18,
    color: '#38bdf8',
    fontFamily: 'Courier',
  },
  coverMeta: {
    marginBottom: 16,
  },
  coverMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#1e293b',
    borderBottomWidth: 1,
  },
  coverMetaLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coverMetaValue: {
    fontSize: 11,
    color: '#ffffff',
  },
  coverScore: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginVertical: 20,
  },
  coverScoreValue: {
    fontSize: 64,
    fontFamily: 'Helvetica-Bold',
    color: '#22c55e',
  },
  coverScoreLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    letterSpacing: 1,
  },
  coverFooter: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
    marginBottom: 4,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 10,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 0.5,
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  colCookie: { width: '30%' },
  colProvider: { width: '25%' },
  colType: { width: '20%' },
  colDuration: { width: '25%' },
  colScriptUrl: { width: '45%' },
  colScriptProvider: { width: '25%' },
  colScriptCompliant: { width: '15%' },
  colScriptTracker: { width: '15%' },
  colFormUrl: { width: '40%' },
  colFormMethod: { width: '15%' },
  colFormFields: { width: '15%' },
  colFormConsent: { width: '30%' },
  threatRow: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
    borderLeftColor: '#dc2626',
    borderLeftWidth: 3,
  },
  threatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  threatType: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#0f172a',
  },
  threatSeverity: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: '#ffffff',
    borderRadius: 3,
  },
  severityCritical: { backgroundColor: '#dc2626' },
  severityHigh: { backgroundColor: '#ea580c' },
  severityMedium: { backgroundColor: '#ca8a04' },
  severityLow: { backgroundColor: '#65a30d' },
  threatDescription: {
    fontSize: 9,
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  threatMeta: {
    fontSize: 8,
    color: '#64748b',
    fontFamily: 'Courier',
    marginTop: 2,
  },
  threatFix: {
    fontSize: 9,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 3,
    marginTop: 4,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    paddingTop: 8,
    borderTopColor: '#e2e8f0',
    borderTopWidth: 0.5,
  },
});

// ============================================================================
// Severity → color helper
// ============================================================================

function severityStyle(severity: string) {
  const s = severity.toUpperCase();
  if (s === 'CRITICAL') return styles.severityCritical;
  if (s === 'HIGH') return styles.severityHigh;
  if (s === 'MEDIUM') return styles.severityMedium;
  return styles.severityLow;
}

// ============================================================================
// Footer (tüm sayfalarda)
// ============================================================================

function ReportFooter({ workspaceName }: { workspaceName: string }) {
  return (
    <Text style={styles.footer} fixed>
      Generated by Noktanyus Compliance Tracker — {workspaceName}
    </Text>
  );
}

// ============================================================================
// Cover Page
// ============================================================================

function CoverPage({ cv }: { cv: AuditReportCv }) {
  const scoreColor =
    cv.score >= 90
      ? '#22c55e'
      : cv.score >= 70
      ? '#eab308'
      : cv.score >= 40
      ? '#f97316'
      : '#dc2626';

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverInner}>
        <View>
          <View style={styles.coverTop}>
            {cv.workspaceLogoUrl ? (
              <Image src={cv.workspaceLogoUrl} style={styles.coverLogo} />
            ) : null}
            <Text style={styles.coverBrand}>NOKTANYUS COMPLIANCE TRACKER</Text>
          </View>

          <View style={styles.coverTitleBlock}>
            <Text style={styles.coverTitle}>Compliance Audit Report</Text>
            <Text style={styles.coverSubtitle}>{cv.workspaceName}</Text>
            <Text style={styles.coverDomain}>{cv.domain}</Text>
          </View>

          <View style={styles.coverScore}>
            <Text style={[styles.coverScoreValue, { color: scoreColor }]}>
              {cv.score}
            </Text>
            <Text style={styles.coverScoreLabel}>COMPLIANCE SCORE / 100</Text>
          </View>
        </View>

        <View>
          <View style={styles.coverMeta}>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Site Name</Text>
              <Text style={styles.coverMetaValue}>{cv.siteName}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Report Date</Text>
              <Text style={styles.coverMetaValue}>{cv.reportDate}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Scan Date</Text>
              <Text style={styles.coverMetaValue}>{cv.scanDate}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Pages Scanned</Text>
              <Text style={styles.coverMetaValue}>{cv.pagesScanned}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Duration</Text>
              <Text style={styles.coverMetaValue}>
                {(cv.durationMs / 1000).toFixed(1)}s
              </Text>
            </View>
          </View>

          <Text style={styles.coverFooter}>
            KVKK / GDPR Uyumluluk Raporu — Bu belge Noktanyus Compliance Tracker
            tarafından otomatik üretilmiştir.
          </Text>
        </View>
      </View>
    </Page>
  );
}

// ============================================================================
// Summary page
// ============================================================================

function SummaryPage({ cv }: { cv: AuditReportCv }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Summary</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Compliance Score</Text>
        <Text style={styles.summaryValue}>{cv.score} / 100</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Threats</Text>
        <Text style={styles.summaryValue}>{cv.totalThreats}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Critical Threats</Text>
        <Text style={styles.summaryValue}>{cv.threatCounts.CRITICAL}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>High Threats</Text>
        <Text style={styles.summaryValue}>{cv.threatCounts.HIGH}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Medium Threats</Text>
        <Text style={styles.summaryValue}>{cv.threatCounts.MEDIUM}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Low Threats</Text>
        <Text style={styles.summaryValue}>{cv.threatCounts.LOW}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Cookies Detected</Text>
        <Text style={styles.summaryValue}>{cv.cookies.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Tracking Scripts</Text>
        <Text style={styles.summaryValue}>{cv.trackingScripts.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Forms Detected</Text>
        <Text style={styles.summaryValue}>{cv.forms.length}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Pages Scanned</Text>
        <Text style={styles.summaryValue}>{cv.pagesScanned}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Scan Duration</Text>
        <Text style={styles.summaryValue}>{(cv.durationMs / 1000).toFixed(1)}s</Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        Top 5 Threats (by Severity)
      </Text>

      {cv.threats.slice(0, 5).map((t, idx) => (
        <View key={`top-${idx}`} style={styles.threatRow}>
          <View style={styles.threatHeader}>
            <Text style={styles.threatType}>
              [{t.severity}] {t.type}
            </Text>
          </View>
          <Text style={styles.threatDescription}>{t.description}</Text>
          {t.regulationRef ? (
            <Text style={styles.threatMeta}>{t.regulationRef}</Text>
          ) : null}
        </View>
      ))}

      <ReportFooter workspaceName={cv.workspaceName} />
    </Page>
  );
}

// ============================================================================
// Cookies page
// ============================================================================

function CookiesPage({ cv }: { cv: AuditReportCv }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Cookies ({cv.cookies.length})</Text>

      <View style={styles.tableHeader}>
        <Text style={styles.colCookie}>Name</Text>
        <Text style={styles.colProvider}>Provider</Text>
        <Text style={styles.colType}>Type</Text>
        <Text style={styles.colDuration}>Duration</Text>
      </View>

      {cv.cookies.length === 0 ? (
        <Text style={{ fontSize: 10, color: '#64748b', padding: 8 }}>
          No cookies detected.
        </Text>
      ) : (
        cv.cookies.map((c, idx) => (
          <View key={`cookie-${idx}`} style={styles.tableRow}>
            <Text style={styles.colCookie}>{c.name}</Text>
            <Text style={styles.colProvider}>{c.provider ?? '—'}</Text>
            <Text style={styles.colType}>{c.type}</Text>
            <Text style={styles.colDuration}>{c.duration ?? '—'}</Text>
          </View>
        ))
      )}

      <ReportFooter workspaceName={cv.workspaceName} />
    </Page>
  );
}

// ============================================================================
// Tracking Scripts page
// ============================================================================

function TrackingScriptsPage({ cv }: { cv: AuditReportCv }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>
        Tracking Scripts ({cv.trackingScripts.length})
      </Text>

      <View style={styles.tableHeader}>
        <Text style={styles.colScriptUrl}>URL</Text>
        <Text style={styles.colScriptProvider}>Provider</Text>
        <Text style={styles.colScriptTracker}>Tracker</Text>
        <Text style={styles.colScriptCompliant}>GDPR</Text>
      </View>

      {cv.trackingScripts.length === 0 ? (
        <Text style={{ fontSize: 10, color: '#64748b', padding: 8 }}>
          No tracking scripts detected.
        </Text>
      ) : (
        cv.trackingScripts.map((s, idx) => (
          <View key={`script-${idx}`} style={styles.tableRow}>
            <Text style={styles.colScriptUrl}>{s.url}</Text>
            <Text style={styles.colScriptProvider}>{s.provider}</Text>
            <Text style={styles.colScriptTracker}>{s.knownTracker ?? '—'}</Text>
            <Text style={styles.colScriptCompliant}>
              {s.gdprCompliant ? 'OK' : 'FAIL'}
            </Text>
          </View>
        ))
      )}

      <ReportFooter workspaceName={cv.workspaceName} />
    </Page>
  );
}

// ============================================================================
// Forms page
// ============================================================================

function FormsPage({ cv }: { cv: AuditReportCv }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Forms ({cv.forms.length})</Text>

      <View style={styles.tableHeader}>
        <Text style={styles.colFormUrl}>URL</Text>
        <Text style={styles.colFormMethod}>Method</Text>
        <Text style={styles.colFormFields}>Fields</Text>
        <Text style={styles.colFormConsent}>Consent</Text>
      </View>

      {cv.forms.length === 0 ? (
        <Text style={{ fontSize: 10, color: '#64748b', padding: 8 }}>
          No forms detected.
        </Text>
      ) : (
        cv.forms.map((f, idx) => (
          <View key={`form-${idx}`} style={styles.tableRow}>
            <Text style={styles.colFormUrl}>{f.url}</Text>
            <Text style={styles.colFormMethod}>{f.method}</Text>
            <Text style={styles.colFormFields}>{f.fieldsCount}</Text>
            <Text style={styles.colFormConsent}>
              {f.consentRequired ? 'YES' : 'NO'}
            </Text>
          </View>
        ))
      )}

      <ReportFooter workspaceName={cv.workspaceName} />
    </Page>
  );
}

// ============================================================================
// Threats page
// ============================================================================

function ThreatsPage({ cv }: { cv: AuditReportCv }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>
        Threats Detected ({cv.threats.length})
      </Text>

      {cv.threats.length === 0 ? (
        <Text style={{ fontSize: 11, color: '#16a34a', padding: 8 }}>
          No threats detected — full compliance achieved.
        </Text>
      ) : (
        cv.threats.map((t, idx) => (
          <View key={`threat-${idx}`} style={styles.threatRow}>
            <View style={styles.threatHeader}>
              <Text style={styles.threatType}>{t.type}</Text>
              <Text style={[styles.threatSeverity, severityStyle(t.severity)]}>
                {t.severity}
              </Text>
            </View>
            <Text style={styles.threatDescription}>{t.description}</Text>
            {t.regulationRef ? (
              <Text style={styles.threatMeta}>Regulation: {t.regulationRef}</Text>
            ) : null}
            {t.pageUrl ? (
              <Text style={styles.threatMeta}>Page: {t.pageUrl}</Text>
            ) : null}
            {t.fixSuggestion ? (
              <Text style={styles.threatFix}>
                Fix: {t.fixSuggestion}
              </Text>
            ) : null}
          </View>
        ))
      )}

      <ReportFooter workspaceName={cv.workspaceName} />
    </Page>
  );
}

// ============================================================================
// AuditReportDocument — root Document
// ============================================================================

export function AuditReportDocument({ cv }: { cv: AuditReportCv }) {
  return (
    <Document
      title={`Compliance Audit Report — ${cv.domain}`}
      author="Noktanyus Compliance Tracker"
      subject={`KVKK/GDPR Audit for ${cv.domain}`}
      creator="Noktanyus"
      producer="Noktanyus Compliance Tracker"
    >
      <CoverPage cv={cv} />
      <SummaryPage cv={cv} />
      <CookiesPage cv={cv} />
      <TrackingScriptsPage cv={cv} />
      <FormsPage cv={cv} />
      <ThreatsPage cv={cv} />
    </Document>
  );
}

export default AuditReportDocument;