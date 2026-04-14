# Bug Tracker - Osassy's Kitchen

**Last Updated:** March 31, 2026

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

### BUG-015: No session expiry configured — JWT sessions last 30 days
- **Reported:** March 31, 2026
- **Severity:** Medium
- **Status:** Open
- **Affected Area:** Authentication (`src/pages/api/auth/[...nextauth].ts`)

**Description:**
The NextAuth configuration has no explicit `session.maxAge` set, so JWT sessions default to 30 days. There is no token refresh interval or forced re-authentication logic. Users remain authenticated for an entire month without any session validity checks.

**Expected:** Sessions should expire after a reasonable period (e.g., 24 hours or 7 days) with graceful redirect to login
**Actual:** Sessions persist for 30 days with no expiry handling

**Notes:**
Related to BUG-001 (sign-out not syncing across tabs). Fix should include:
- Set `session.maxAge` in NextAuth config (e.g., 7 days)
- Add `refetchInterval` to periodically check session validity
- Handle expired sessions on the frontend (redirect to `/login` with return URL)
- Consider shorter expiry for admin sessions

---

### BUG-014: Forgot password email not received
- **Reported:** March 31, 2026
- **Severity:** High
- **Status:** Open
- **Affected Area:** Forgot password flow (`src/pages/auth/forgot-password.tsx`, `src/pages/api/auth/forgot-password.ts`, `src/lib/email.ts`)

**Description:**
When using the forgot password functionality, the form submits successfully and shows a confirmation message, but no email is actually received by the user. The UI indicates the email was sent, but nothing arrives in the inbox (or spam/junk folders).

**Steps to Reproduce:**
1. Navigate to the login page
2. Click "Forgot Password"
3. Enter a valid registered email address
4. Submit the form
5. UI confirms the email was sent
6. Check inbox and spam — no email received

**Expected:** User receives a password reset email with a valid reset link
**Actual:** No email is received despite the UI confirming it was sent

**Notes:**
Likely related to BUG-004 (Resend domain verification). Possible causes:
- Resend rejecting the send due to unverified domain (403 error silently caught)
- Email being sent from `onboarding@resend.dev` which may be filtered/blocked
- The API route may be returning success without confirming email delivery
- Error in the reset token generation or email template
- Check Resend dashboard logs for delivery status

---

### BUG-013: Audit all hidden/non-navigable routes for functionality and branding
- **Reported:** March 31, 2026
- **Severity:** Low
- **Status:** Open
- **Affected Area:** All routes not directly linked in main navigation

**Description:**
Several pages in the application are not accessible via the main navigation (e.g., success/confirmation pages, error pages, auth callback routes, terms/privacy pages, unauthorised page, etc.). These need a manual walkthrough to verify they:
1. Load correctly without errors
2. Display the correct content
3. Follow the Osassy's Kitchen brand design system (colours, typography, layout)
4. Have consistent header/footer
5. Are responsive across breakpoints

**Steps to Reproduce:**
1. Review all routes defined in `src/pages/` (including nested routes)
2. Identify routes not linked in the main navigation
3. Visit each route manually
4. Check functionality, styling, and branding consistency

**Expected:** All routes should be fully functional with consistent Osassy's Kitchen branding
**Actual:** Needs verification — some hidden routes may have missing styles, broken layouts, or default/unstyled content

**Notes:**
This is a QA verification task. Key routes to check include:
- Order confirmation/success pages
- Payment cancelled/failed pages
- `/unauthorized` page
- `/auth/reset-password` and related auth flows
- Any 404/error pages
- Terms, privacy, and legal pages (if they exist)
- Admin sub-pages not in main nav

---

### BUG-012: Verify agreed delivery date shown on order confirmation page
- **Reported:** March 31, 2026
- **Severity:** Low
- **Status:** Open
- **Affected Area:** Order confirmation / success page

**Description:**
After a successful checkout, the confirmation page displays a delivery date. Need to verify that this date matches the delivery date the user agreed to during the subscription/checkout flow, rather than a default or incorrectly calculated date.

**Steps to Reproduce:**
1. Go through the meal plan wizard and select a delivery date/slot
2. Complete checkout via Stripe
3. On the order confirmation/success page, check the delivery date displayed
4. Compare it to the date selected during the wizard

**Expected:** The confirmation page should show the exact delivery date the user selected during checkout
**Actual:** Needs verification — may be showing an incorrect or default date

**Notes:**
This is a verification task rather than a confirmed bug. Check that the delivery date is correctly passed through from the wizard to Stripe metadata and then displayed on the confirmation page.

---

### BUG-011: Password visibility toggle (eye icon) does not reveal password
- **Reported:** March 31, 2026
- **Severity:** Medium
- **Status:** Open
- **Affected Area:** Login (`src/pages/login.tsx`), Sign-up (`src/pages/signup.tsx`), Reset Password (`src/pages/auth/reset-password.tsx`)

**Description:**
Clicking the eye icon next to the password field does not toggle the password between visible and hidden. The password remains masked regardless of clicking the toggle button.

**Steps to Reproduce:**
1. Navigate to `/login` (or `/signup` or `/auth/reset-password`)
2. Enter text into the password field
3. Click the eye icon to reveal the password
4. Password remains masked — no visible change

**Expected:** Clicking the eye icon should toggle the input type between `password` and `text`, revealing the entered characters
**Actual:** Clicking the eye icon has no visible effect; password stays masked

**Notes:**
The toggle logic in code appears correct (`showPassword` state toggles the input `type` between `text` and `password`). Likely causes:
- The eye icon button may not be receiving click events (CSS `pointer-events: none` or an overlay blocking clicks)
- Font Awesome icons may not be loading, making the button invisible/unreachable
- A CSS z-index or positioning issue may prevent the button from being clickable
- Affects all three pages with password fields: login, sign-up, and reset password

---

### BUG-010: Authenticated pages accessible without login
- **Reported:** March 31, 2026
- **Severity:** High
- **Status:** Open
- **Affected Area:** Admin dashboard, user dashboard — all protected routes

**Description:**
Unauthenticated users can navigate directly to admin and user dashboard pages (e.g., `/admin/dashboard`, `/user/dashboard`). Although some functionality is hidden, the pages still render and are accessible. Protected routes should redirect unauthenticated users to `/login` before rendering any content.

**Steps to Reproduce:**
1. Open the app without logging in
2. Navigate directly to `/admin/dashboard` (or any `/admin/*` or `/user/*` route)
3. The page renders instead of redirecting to login

**Expected:** Unauthenticated users should be redirected to `/login` with a return URL
**Actual:** Pages render with partial functionality visible

**Notes:**
All routes under `/admin/*` and `/user/*` must have server-side auth guards via `getServerSideProps`. Admin routes must additionally check for `role === 'ADMIN'`. Audit all protected pages and ensure consistent auth checking.

---

### BUG-009: Duplicate cancellation notification from API and webhook
- **Reported:** March 31, 2026
- **Severity:** Medium
- **Status:** Open
- **Affected Area:** Subscription cancellation (`src/pages/api/user/subscriptions/[id].ts`, `src/pages/api/webhooks/stripe.ts`)

**Description:**
When a user cancels a subscription, an admin notification email may be sent twice — once from the API route handler and once from the Stripe `customer.subscription.deleted` webhook. Both paths call `sendAdminCancellationNotification`.

**Expected:** Admin receives one cancellation notification
**Actual:** Admin may receive two identical notifications

**Notes:**
Decide on a single notification point. The webhook is more reliable since it covers all cancellation paths (API, Stripe dashboard, failed payments). Consider removing the notification from the API route and relying solely on the webhook.

---

### BUG-008: Sequential email sends block Stripe webhook response
- **Reported:** March 31, 2026
- **Severity:** High
- **Status:** Open
- **Affected Area:** Stripe webhook (`src/pages/api/webhooks/stripe.ts`)

**Description:**
In the `checkout.session.completed` handler, two admin notification emails are sent sequentially with `await`. If Resend is slow or times out, the webhook response to Stripe is delayed. Stripe expects responses within ~10 seconds and will retry, potentially causing duplicate order processing.

**Steps to Reproduce:**
1. Complete a checkout via Stripe
2. If email service is slow, webhook response exceeds Stripe's timeout
3. Stripe retries the webhook, potentially creating duplicate orders

**Expected:** Webhook responds promptly regardless of email delivery speed
**Actual:** Email sends block the webhook response

**Notes:**
Fix by using `Promise.all()` for parallel sends, or remove `await` (fire-and-forget) since emails are already wrapped in try/catch and are non-critical.

---

### BUG-007: HTML injection risk in admin email templates
- **Reported:** March 31, 2026
- **Severity:** Medium
- **Status:** Open
- **Affected Area:** Email templates (`src/lib/emailTemplates.ts`)

**Description:**
Admin email templates interpolate user-supplied values (customer name, email, delivery address) directly into HTML without escaping. If a user registers with a name containing HTML tags (e.g., `<script>alert('xss')</script>`), it will be rendered in the admin's email client.

**Steps to Reproduce:**
1. Register with a name containing HTML tags
2. Place an order or create a subscription
3. Admin notification email contains unescaped HTML

**Expected:** User-supplied values should be HTML-encoded before interpolation
**Actual:** Raw user input is placed directly into HTML templates

**Notes:**
Most email clients strip script tags, but this is still poor practice. Add an `escapeHtml()` utility function and apply it to all user-supplied values in admin email templates.

---

### BUG-006: Redundant database query in webhook recurring order handler
- **Reported:** March 31, 2026
- **Severity:** Low
- **Status:** Open
- **Affected Area:** Stripe webhook (`src/pages/api/webhooks/stripe.ts`)

**Description:**
In the `invoice.payment_succeeded` handler, a separate `prisma.user.findUnique` call is made to fetch the user, even though the subscription was already fetched earlier. The user relation could be included in the original subscription query with `include: { user: true }`.

**Notes:**
Minor performance optimisation. Combine the queries by adding `user: true` to the existing subscription include.

---

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
| Open | 15 |
| In Progress | 0 |
| Fixed (This Phase) | 0 |
| Total Closed | 0 |
