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
| Open | 2 |
| In Progress | 0 |
| Fixed (This Phase) | 0 |
| Total Closed | 0 |
