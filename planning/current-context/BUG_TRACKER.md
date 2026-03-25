# Bug Tracker - Osassy's Kitchen

**Last Updated:** March 14, 2026

## How to Use This Document

When reporting a bug, add an entry under "Open Bugs" with:
- **ID**: BUG-XXX (increment from last)
- **Reported**: Date
- **Severity**: Critical / High / Medium / Low
- **Status**: Open / In Progress / Fixed / Closed
- **Description**: What's happening
- **Steps to Reproduce**: How to trigger it
- **Expected vs Actual**: What should happen vs what does happen
- **Affected Area**: Page/component/API affected

---

## Open Bugs

### BUG-005: Email templates need more branding/styling
- **Reported:** March 25, 2026
- **Severity:** Low
- **Status:** Open
- **Affected Area:** Email templates (`src/lib/emailTemplates.ts`)

**Description:**
The contact form email templates are functional but could be enhanced with more Osassy's Kitchen branding — logo, richer styling, imagery, etc.

**Notes:**
- Consider adding logo image to email header
- Review colour usage and typography
- Add social media links to footer
- Consider responsive improvements for mobile email clients
- Test across different email clients (Gmail, Outlook, Apple Mail)

---

### BUG-004: Email sending requires verified domain for production
- **Reported:** March 25, 2026
- **Severity:** Medium
- **Status:** Open (Workaround in place)
- **Affected Area:** Email service (`src/lib/email.ts`)

**Description:**
Resend email service returns 403 "Domain not verified" error when trying to send emails from a Gmail address. Currently using `onboarding@resend.dev` as a temporary workaround for development/testing.

**Steps to Reproduce:**
1. Set `EMAIL_FROM` to any email address on a domain you don't own (e.g., `@gmail.com`)
2. Submit the contact form
3. Check Resend logs — 403 error with "Domain not verified"

**Expected:** Emails should send successfully
**Actual:** 403 error — Resend requires domain verification

**Workaround:**
Set `EMAIL_FROM="Osassy's Kitchen <onboarding@resend.dev>"` in `.env.local` for testing.

**Production Fix Required:**
1. Verify `osassyskitchen.com` domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC) as instructed by Resend
3. Update `EMAIL_FROM` to `noreply@osassyskitchen.com` or similar
4. Update `SUPPORT_EMAIL` to the actual support inbox

**Notes:**
This is a configuration task, not a code fix. Must be done before production launch.

---

### BUG-003: Delivery time slots need business validation
- **Reported:** March 14, 2026
- **Severity:** Medium
- **Status:** Open
- **Affected Area:** Delivery step in subscription wizard

**Description:**
The delivery time slots currently shown to users may not reflect actual availability for the client (Osassy's Kitchen) to deliver food. Time slots need to be validated against business constraints such as:
- Kitchen preparation times
- Driver availability
- Geographic delivery zones
- Cut-off times for same-day/next-day orders

**Steps to Reproduce:**
1. Go through the meal plan wizard
2. Reach the delivery step
3. Note that time slots are shown without consideration of business availability

**Expected:** Only show time slots that the business can actually fulfil
**Actual:** Time slots may be displayed that aren't operationally feasible

**Notes:**
This requires business input to define:
- Available delivery days (e.g., Tue/Wed/Thu only?)
- Available time windows (e.g., 12pm-2pm, 6pm-8pm)
- Lead time required (e.g., orders must be placed 48hrs in advance)
- Geographic restrictions per time slot
- Maximum orders per slot (capacity)

Consider implementing a delivery slot configuration in admin dashboard.

---

### BUG-002: Meal Plans nav link skips process explainer page
- **Reported:** March 14, 2026
- **Severity:** Low
- **Status:** Open
- **Affected Area:** Navigation (`src/data/navigationConfig.ts`)

**Description:**
For logged-in users, the "Meal Plans" navigation link currently points directly to `/user/subscriptions/create` (the dashboard wizard). However, the intended flow was for users to first see the `/meal-plans` process explainer page (how we prepare food, sourcing, packaging, etc.) with plan selection cards at the bottom.

**Steps to Reproduce:**
1. Log in as a user
2. Click "Meal Plans" in the navigation bar
3. User is taken directly to `/user/subscriptions/create`

**Expected:** Logged-in users should go to `/meal-plans` (process explainer) first, then select a plan which takes them to the dashboard wizard
**Actual:** Logged-in users skip the process explainer and go straight to the wizard

**Notes:**
The navigation config was updated to point authenticated users directly to the wizard. Need to revert so all users see `/meal-plans` first, with the plan cards linking to the appropriate wizard (guest → `/meal-plans/create`, logged-in → `/user/subscriptions/create`).

---

### BUG-001: Sign-out not syncing across browser tabs
- **Reported:** March 14, 2026
- **Severity:** High
- **Status:** Open
- **Affected Area:** Authentication (NextAuth.js)

**Description:**
When a user has multiple tabs open and signs out in one tab, the other tabs retain a fully functional session. The session persists even after refreshing — the user remains fully authenticated and can continue using the app indefinitely.

**Steps to Reproduce:**
1. Log into the application
2. Open the same site in a second browser tab
3. Sign out in the first tab
4. Switch to the second tab — user still appears logged in
5. Refresh the second tab — user is STILL logged in
6. User can continue performing authenticated actions

**Expected:** All tabs should invalidate the session when user signs out; refreshing should redirect to login
**Actual:** Other tabs retain a fully working session permanently — refreshing does NOT fix it

**Notes:**
This suggests the session is not being invalidated server-side, only client-side. Possible causes:
- Sign-out only clears the cookie in the current tab context
- Session token still valid on server (not revoked)
- JWT strategy may not support true server-side invalidation
- May need to implement session revocation in database

This is more serious than a simple tab-sync issue — it's a session invalidation problem.

---

<!-- Template for new bugs:

### BUG-001: [Short Title]
- **Reported:** [Date]
- **Severity:** [Critical/High/Medium/Low]
- **Status:** Open
- **Affected Area:** [Page/Component/API]

**Description:**
[What's happening]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected:** [What should happen]
**Actual:** [What actually happens]

**Notes:**
[Any additional context, screenshots references, etc.]

---

-->

---

## Fixed Bugs

### BUG-000: Template Example (Fixed)
- **Reported:** March 14, 2026
- **Severity:** Low
- **Status:** Fixed
- **Affected Area:** N/A

**Description:**
This is a template example showing the format for bug entries.

**Resolution:**
Document created as reference template.

---

## Bug Severity Guide

| Severity | Definition | Response Time |
|----------|------------|---------------|
| **Critical** | App unusable, data loss, security issue | Immediate |
| **High** | Major feature broken, no workaround | Same session |
| **Medium** | Feature impaired but workaround exists | Next session |
| **Low** | Minor issue, cosmetic, edge case | When convenient |

---

## Statistics

| Status | Count |
|--------|-------|
| Open | 5 |
| In Progress | 0 |
| Fixed (This Phase) | 0 |
| Total Closed | 0 |
