<!--
  GDPR Privacy Policy — Base Template (Phase 4 C.3)

  EU General Data Protection Regulation (Regulation (EU) 2016/679) uyumlu
  privacy policy şablonu. AI tarafından doldurulur; {{...}} placeholder'lar
  policyGenerator.ts tarafından doldurulur.

  Yapı: Articles 13, 14, 15, 16, 17, 20, 21 referansları + lawful basis
  table + data subject rights + DPO contact.

  Düzenleyici referanslar GDPR Madde numaralarıyla verilmiştir.
-->

# {{COMPANY_NAME}} PRIVACY POLICY (GDPR)

**Last updated:** {{POLICY_DATE}}
**Version:** {{VERSION}}
**Published at:** {{PUBLISHED_URL}}

This Privacy Policy explains how {{COMPANY_NAME}} ("**we**", "**us**", "**the Company**", "**Controller**") collects, uses, discloses, and safeguards your information when you visit {{DOMAIN}} (the "**Platform**"), in compliance with the **General Data Protection Regulation (EU) 2016/679** ("**GDPR**").

By accessing the Platform you confirm that you have read and understood this Policy.

## 1. DATA CONTROLLER [GDPR Art. 13(1)(a), Art. 14(1)(a)]

| Field | Value |
|-------|-------|
| Controller | {{COMPANY_NAME}} |
| Registered address | {{COMPANY_ADDRESS}} |
| Company number | {{COMPANY_NUMBER}} |
| VAT number | {{VAT_NUMBER}} |
| Phone | {{COMPANY_PHONE}} |
| Email | {{CONTACT_EMAIL}} |
| Website | https://{{DOMAIN}} |

Where applicable, the Controller has appointed a **Data Protection Officer** ("DPO") in accordance with Article 37 GDPR:

| Field | Value |
|-------|-------|
| DPO name | {{DPO_NAME}} |
| DPO email | {{DPO_EMAIL}} |
| DPO phone | {{DPO_PHONE}} |

## 2. PERSONAL DATA WE COLLECT [GDPR Art. 13(1)(c), Art. 14(1)(c)]

### 2.1 Data You Provide Directly
- **Identity data:** name, surname, date of birth
- **Contact data:** email, phone, postal address
- **Account credentials:** hashed password, two-factor authentication secrets
- **Payment data:** billing address, last four digits of payment cards (full card numbers are **never** stored by the Controller — handled by our PCI-DSS compliant payment processor)
- **Communications:** support tickets, chat transcripts, survey responses

### 2.2 Data Collected Automatically [Art. 13(1)(f), Art. 14(1)(f)]
- **Technical data:** IP address, browser type/version, operating system, device identifiers
- **Usage data:** pages visited, time on page, referring URL, click patterns
- **Location data:** coarse geographic location derived from IP (precise GPS only with explicit consent)
- **Cookies and similar tracking technologies** — see our Cookie Policy at {{COOKIE_POLICY_URL}}

Detected cookies in use:
{{COOKIE_LIST}}

### 2.3 Data Received From Third Parties [Art. 14(1)(f)]
{{SCAN_THIRD_PARTY_LIST}}

## 3. PURPOSES AND LEGAL BASES OF PROCESSING [GDPR Art. 6, Art. 13(1)(c)]

We process your personal data only when we have a valid legal basis under Article 6 GDPR. The lawful basis table below summarises our processing activities:

| # | Purpose | Lawful Basis (Art. 6) | Categories of Data |
|---|---------|------------------------|---------------------|
| 1 | Account registration & authentication | (b) Performance of contract | Identity, contact, credentials |
| 2 | Order fulfilment & delivery | (b) Performance of contract | Identity, contact, payment |
| 3 | Customer support & complaints | (b) Contract / (f) Legitimate interest | Identity, communications |
| 4 | Invoicing & tax compliance | (c) Legal obligation | Identity, payment, transaction |
| 5 | Fraud detection & security | (f) Legitimate interest | Technical, usage |
| 6 | Analytics & service improvement | (a) Consent **or** (f) Legitimate interest | Usage, technical |
| 7 | Marketing & advertising | (a) Consent | Behavioural, preferences |
| 8 | Personalisation & recommendations | (a) Consent **or** (f) Legitimate interest | Usage, behavioural |
| 9 | Legal claims & enforcement | (f) Legitimate interest | Identity, transaction, communications |

### 3.1 Sensitive Data (Art. 9)
We do not knowingly collect special category data (race, religion, health, sexual orientation, biometrics, etc.) unless:
- You have given **explicit consent** for a specific purpose (Art. 9(2)(a)), **or**
- Processing is necessary for substantial public interest (Art. 9(2)(g)).

## 4. RECIPIENTS AND INTERNATIONAL TRANSFERS [GDPR Art. 13(1)(e), Art. 14(1)(e)]

### 4.1 Categories of Recipients
- **Cloud infrastructure providers** (hosting, storage, CDN)
- **Payment processors** (PCI-DSS compliant)
- **Email & communication service providers**
- **Analytics and marketing platforms**
- **Logistics and delivery partners**
- **Professional advisors** (lawyers, accountants, auditors)
- **Competent authorities** (tax, regulators, law enforcement — only when lawfully required)

### 4.2 International Data Transfers [GDPR Art. 44–49]
Where personal data is transferred outside the European Economic Area (EEA), we rely on one of the following safeguards:
- **Adequacy decision** by the European Commission (Art. 45)
- **Standard Contractual Clauses (SCCs)** with supplementary technical measures (Art. 46(2)(c))
- **Binding Corporate Rules** (Art. 47)
- **Explicit consent** for occasional, non-repetitive transfers (Art. 49(1)(a))

You may request a copy of the safeguards by contacting {{DPO_EMAIL}}.

## 5. RETENTION PERIODS [GDPR Art. 13(2)(a), Art. 5(1)(e)]

We retain personal data only for as long as necessary for the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements.

| Category | Retention Period |
|----------|------------------|
| Account data | Until account deletion + 30 days for restoration |
| Transaction records | 10 years (tax / commercial law obligations) |
| Support communications | 3 years after last contact |
| Analytics / cookies | Up to 13 months (CNIL / EDPB guidance) |
| Marketing consent records | Until consent withdrawal + 3 years (proof of consent) |
| Security logs | 12 months |

## 6. YOUR RIGHTS AS A DATA SUBJECT [GDPR Art. 15–22]

Under the GDPR, you have the following rights:

| Right | Article | Summary |
|-------|---------|---------|
| Right of access | **Art. 15** | Obtain a copy of your personal data and processing information |
| Right to rectification | **Art. 16** | Correct inaccurate or incomplete data |
| Right to erasure ("right to be forgotten") | **Art. 17** | Request deletion when grounds apply |
| Right to restriction of processing | **Art. 18** | Limit how we use your data |
| Right to data portability | **Art. 20** | Receive your data in a structured, machine-readable format |
| Right to object | **Art. 21** | Object to processing based on legitimate interest or direct marketing |
| Rights related to automated decision-making | **Art. 22** | Not be subject to solely automated decisions with legal effects |

### 6.1 How to Exercise Your Rights
To exercise any of these rights, please contact us:
- **Email:** {{CONTACT_EMAIL}} (subject line: "GDPR Data Subject Request")
- **Web form:** https://{{DOMAIN}}/gdpr-request
- **Post:** {{COMPANY_ADDRESS}}

We will respond within **one (1) month** of receipt (extendable by two further months for complex requests, with notice — Art. 12(3)).

### 6.2 Right to Lodge a Complaint [GDPR Art. 77]
Without prejudice to any other administrative or judicial remedy, you have the right to lodge a complaint with a supervisory authority, in particular in the Member State of your habitual residence, place of work, or place of the alleged infringement.

Lead supervisory authority: {{SUPERVISORY_AUTHORITY}}
Website: {{SUPERVISORY_AUTHORITY_URL}}

## 7. DATA SECURITY [GDPR Art. 32]

We implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including:
- **Encryption in transit** (TLS 1.2+) and at rest (AES-256)
- **Access controls** based on least-privilege and role-based access
- **Regular penetration testing** and vulnerability scanning
- **Pseudonymisation** of production data used in non-production environments
- **Incident response procedures** with 72-hour breach notification (Art. 33)
- **Staff training** on data protection and confidentiality

## 8. CHILDREN'S PRIVACY [GDPR Art. 8]

Our Platform is not directed at children under 16 (or the applicable age of digital consent in your Member State). We do not knowingly collect personal data from children. If you believe we have collected data from a child, please contact {{CONTACT_EMAIL}} for prompt deletion.

## 9. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. The "Last updated" date at the top of this page reflects when the Policy was last revised. Material changes will be notified via:
- Email to your registered address
- A prominent notice on the Platform
- (Where required) a request for renewed consent

**Change history**

| Version | Date | Change |
|---------|------|--------|
| {{VERSION}} | {{POLICY_DATE}} | Initial publication (AI-assisted draft) |

---

For any questions about this Policy or our data practices, please contact our Data Protection Officer at {{DPO_EMAIL}}.

*This document is provided in English. Translations into other languages are available upon request; in case of conflict, the English version prevails.*
