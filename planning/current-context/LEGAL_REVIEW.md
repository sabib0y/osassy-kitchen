# Legal Copy Review — Terms of Service & Privacy Policy

**Reviewed:** 23 April 2026
**Reviewer:** Internal development review (not legal counsel)
**Pages reviewed:** `/terms` (`src/pages/terms.tsx`) and `/privacy` (`src/pages/privacy.tsx`)

> **Disclaimer:** This is a technical review cross-referencing the legal copy against the actual business model and codebase. It is not legal advice. A qualified UK solicitor should review all legal copy before production launch.

---

## Executive Summary

Both pages provide a reasonable starting framework but are **significantly incomplete** for a UK-based food delivery subscription service. Key gaps include: no references to UK consumer protection legislation, no food safety or allergen disclaimers, no explicit naming of Stripe as the payment processor in the Terms, incomplete data processor disclosures in the Privacy Policy, and placeholder contact details. Neither page has been updated since January 2025 despite significant feature changes.

---

## Terms of Service Issues

### 1. Outdated "Last updated" Date

> "Last updated: January 2025"

The service has undergone major changes since then (subscription wizard, catering, delivery time slots, Google OAuth). **Update to current date** and implement a process to keep this current.

### 2. Service Description — Incomplete

The description mentions "weekly meal subscription plans" generically but does not reference:

- **Specific plan tiers** (3, 5, or 10 meals per week) — the actual offering
- **One-off meal trays and bulk orders** — a secondary revenue stream
- **Event catering** — a distinct service with its own page (`/catering`)
- **Delivery area** — should explicitly state "London, UK" rather than the vague "service is available in select areas"

**Recommendation:** List all service types and explicitly state the London delivery area.

### 3. Subscription Terms — Missing Auto-Renewal Detail

> "Subscriptions automatically renew unless cancelled before the billing date."

Under the **Consumer Rights Act 2015** and **Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013**, auto-renewal terms must be prominently disclosed with:

- The exact renewal period (weekly/monthly)
- The amount that will be charged
- How to cancel before renewal
- A 14-day cooling-off period for online subscriptions

**Recommendation:** Add a dedicated auto-renewal disclosure section with explicit cancellation instructions and cooling-off period rights.

### 4. Payment Terms — Stripe Not Named

> "All payments are processed securely through our payment provider."

The Privacy Policy names Stripe explicitly, but the Terms do not. This is inconsistent.

> "Prices are displayed in Nigerian Naira (NGN) or British Pounds (GBP)"

The platform is London-based and uses Stripe configured for GBP. **Remove the NGN reference** unless dual-currency pricing is actually supported — it is not evident in the codebase.

> "We accept major credit/debit cards and bank transfers"

Bank transfers are not configured in the Stripe integration. **Remove "bank transfers"** or implement the feature.

**Recommendation:** Name Stripe explicitly, remove NGN, remove bank transfers unless supported.

### 5. Delivery Policy — Vague

> "Service is available in select areas. Check your postcode for availability."

There is no postcode checker in the application. Either build one or state the delivery area explicitly (e.g., "We currently deliver within Greater London").

**Recommendation:** State delivery area explicitly and remove reference to non-existent postcode checker.

### 6. Cancellation & Refunds — Insufficient

> "Refunds for cancelled orders are processed within 5-10 business days, subject to our refund policy."

There is no separate refund policy document linked or available. The 48-hour cancellation window for individual orders is stated but:

- No mention of the **14-day cooling-off period** required under the Consumer Contracts Regulations 2013
- No mention of refund entitlements for food quality issues
- No mention of what happens to remaining meals in a billing period upon cancellation

**Recommendation:** Add a full refund policy section or link to a dedicated refund policy page. Include cooling-off period rights.

### 7. Missing Clauses — Terms of Service

The following sections are entirely absent:

| Missing Clause | Why It Matters |
|---------------|----------------|
| **Food safety & allergen disclaimer** | Required under the Food Safety Act 1990 and EU Regulation 1169/2011 (retained in UK law). Must state that meals may contain allergens and that customers should inform of allergies. |
| **Limitation of liability** | Standard clause limiting liability for indirect/consequential losses. |
| **Intellectual property** | Protection of brand, recipes, images (especially Cloudinary-hosted content). |
| **User-generated content** | If users can upload profile images or leave reviews. |
| **Account responsibilities** | Password security, account sharing, age restrictions. |
| **Governing law & jurisdiction** | Must state "England and Wales" as governing law. |
| **Dispute resolution** | Complaints process, ADR (Alternative Dispute Resolution) as required for UK consumer businesses. |
| **Force majeure** | Covers delivery failures due to events beyond control. |
| **Acceptable use** | What users may and may not do on the platform. |
| **Age requirement** | Minimum age to create an account (typically 18 for payment processing). |

### 8. Broken `href` in Contact Section

```tsx
<a href="tel:+441onal234567890">+44 (0) 123 456 7890</a>
```

The `href` contains a malformed string: `+441onal234567890`. This appears to be a typo/placeholder. The phone number itself (`+44 (0) 123 456 7890`) is clearly a placeholder and must be replaced with a real number before launch.

---

## Privacy Policy Issues

### 1. Outdated "Last updated" Date

Same issue as Terms — states "January 2025".

### 2. No Reference to UK GDPR or Applicable Legislation

The policy references "data protection laws" generically but does not cite:

- **UK General Data Protection Regulation (UK GDPR)**
- **Data Protection Act 2018**
- **Privacy and Electronic Communications Regulations 2003 (PECR)** — relevant for marketing emails and cookies

**Recommendation:** Explicitly state compliance with UK GDPR and the Data Protection Act 2018. Reference PECR for cookie and marketing consent.

### 3. No Legal Basis for Processing

The policy lists purposes for data processing but does not state the **lawful basis** for each purpose as required by UK GDPR Article 6. For example:

| Purpose | Likely Lawful Basis |
|---------|-------------------|
| Order fulfilment | Contract performance |
| Account management | Contract performance |
| Service communications | Legitimate interest |
| Marketing | Consent |
| Analytics | Legitimate interest |
| Legal compliance | Legal obligation |

**Recommendation:** Add a "Legal Basis for Processing" section mapping each purpose to its lawful basis.

### 4. Incomplete Third-Party Processor List

The policy mentions Stripe and generic "delivery partners", "analytics providers", and "communication services" but does not name:

- **Cloudinary** — stores user-uploaded images and meal photos
- **Resend** — handles transactional and marketing emails
- **Google** — OAuth authentication provider (has access to name, email, profile picture)
- **Vercel** — hosting provider (has access to server logs, IP addresses)

**Recommendation:** Name all third-party processors or maintain a separate sub-processor list linked from the policy.

### 5. No Cookie Policy

The policy mentions "cookies and similar tracking technologies" in the data collection section but provides no detail on:

- What cookies are set (NextAuth session cookies, analytics cookies, etc.)
- Cookie categories (strictly necessary, functional, analytics, marketing)
- How to manage/reject cookies
- Cookie consent mechanism (required under PECR)

**Recommendation:** Add a dedicated cookie policy section or link to a separate cookie policy page. Implement a cookie consent banner.

### 6. No Data Protection Officer or Representative

For a small business this may not be legally required, but the policy should at minimum:

- Name a data protection contact person (not just a generic email)
- State whether a DPO has been appointed
- Provide the ICO (Information Commissioner's Office) contact details for complaints

**Recommendation:** Add ICO contact information and a named data protection contact.

### 7. No International Data Transfer Disclosure

If data is processed or stored outside the UK (e.g., Stripe servers in the US, Cloudinary CDN, Vercel edge nodes), this must be disclosed along with the safeguards in place (e.g., Standard Contractual Clauses, UK adequacy decisions).

**Recommendation:** Add an "International Data Transfers" section.

### 8. Data Retention Periods Not Specified

> "We retain your data only as long as necessary for the purposes outlined in this policy."

UK GDPR requires specific retention periods. For example:

- Account data: duration of account + X months
- Order history: 6 years (HMRC requirements)
- Payment records: 6 years (tax/accounting)
- Marketing consent records: duration of consent

**Recommendation:** Add a data retention schedule.

### 9. Subject Access Request Timeframe

> "We will respond to your request within 30 days."

UK GDPR specifies **one calendar month** (not 30 days). While close, the correct terminology should be used.

**Recommendation:** Change to "within one calendar month" to align with UK GDPR Article 12(3).

### 10. No Children's Data Section

If the service is not intended for children under 13 (or 16 under UK GDPR), this should be explicitly stated.

---

## Consistency Issues

| Issue | Location | Detail |
|-------|----------|--------|
| Stripe named in Privacy but not Terms | Terms s.4 / Privacy s.4 | Inconsistent disclosure |
| NGN currency mentioned | Terms s.4 | Platform only supports GBP |
| "Bank transfers" mentioned | Terms s.4 | Not supported in Stripe config |
| Placeholder phone number | Both pages | `+44 (0) 123 456 7890` is not real |
| Malformed tel: href | Terms s.7 | `+441onal234567890` is broken |
| "Select areas" delivery | Terms s.5 | Should say "London" explicitly |
| No postcode checker | Terms s.5 | Referenced but does not exist |
| Plan details omitted | Terms s.3 | 3/5/10 meals per week not mentioned |

---

## Recommended Next Steps

### Priority 1 — Before Launch (Blocking)

1. **Engage a UK solicitor** specialising in food business and e-commerce to review and finalise both documents.
2. **Fix the malformed phone `href`** in Terms — this is a code bug regardless of legal review.
3. **Replace placeholder phone numbers** with real contact details.
4. **Update "Last updated" dates** on both pages.
5. **Add allergen disclaimer** — legally required for food businesses under the Food Safety Act 1990.
6. **Add governing law clause** — "These terms are governed by the laws of England and Wales."
7. **Add UK GDPR references** and lawful basis for processing to the Privacy Policy.
8. **Remove NGN currency reference** and "bank transfers" from Payment Terms.

### Priority 2 — Before Launch (Important)

9. **Add cookie policy** and implement cookie consent banner (PECR requirement).
10. **Add 14-day cooling-off period** disclosure (Consumer Contracts Regulations 2013).
11. **Name all third-party processors** (Cloudinary, Resend, Google, Vercel).
12. **Add international data transfer** disclosures.
13. **Add data retention schedule** with specific periods.
14. **Add ICO contact details** for data protection complaints.
15. **Add limitation of liability** and force majeure clauses.

### Priority 3 — Post-Launch (Enhancement)

16. **Create separate pages** for Cookie Policy and Refund Policy.
17. **Implement postcode checker** or remove reference from Terms.
18. **Add dispute resolution** and ADR information.
19. **Consider Terms versioning** — maintain a changelog of Terms updates.

---

*This review should be re-run after legal counsel has updated the documents to verify all issues have been addressed.*
