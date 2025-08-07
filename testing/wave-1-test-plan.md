# Wave 1 Testing Plan - Phase 4 Implementation
**Osassy's Kitchen - Testing Checklist for Completed Chunks**

## Overview
This document provides a comprehensive testing checklist for the first wave of Phase 4 implementation, covering Chunks 001, 003, and 005.

---

## 🧪 Testing Environment Setup

### Prerequisites Checklist
- [ ] Node.js and npm installed
- [ ] Development server can start (`npm run dev`)
- [ ] Environment variables configured:
  - [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
  - [ ] `DATABASE_URL` is configured
  - [ ] `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set
- [ ] Database is running and accessible
- [ ] Stripe CLI installed (for webhook testing)

### Build Verification
```bash
# Run these commands and verify no errors
- [ ] npm run build
- [ ] npm run type-check (if available)
- [ ] npm run lint
```

---

## 📋 Chunk-001: API Integration Foundation Testing

### 1. TypeScript Compilation Tests
- [ ] All TypeScript files compile without errors
- [ ] No `any` types used unintentionally
- [ ] Proper type inference in IDE (IntelliSense working)

### 2. API Client Basic Functionality
```typescript
// Manual test in browser console or test file
- [ ] Can import api client: import { api } from '@/lib/api-client'
- [ ] GET request works: api.get('/api/menu-items')
- [ ] POST request works: api.post('/api/test', { data: 'test' })
- [ ] Error handling works: api.get('/api/non-existent-endpoint')
- [ ] Timeout works: Set timeout to 1ms and verify timeout error
```

### 3. Authentication Integration
- [ ] Authenticated requests include session token
- [ ] Unauthenticated requests work for public endpoints
- [ ] 401 errors redirect to login page
- [ ] Session refresh works after token expiry

### 4. React Query Hook Tests
```typescript
// Test in a React component
- [ ] useMenuItems hook returns data
- [ ] useOrders hook requires authentication
- [ ] useCreateOrder mutation works
- [ ] Cache invalidation triggers refetch
- [ ] Loading states work correctly
- [ ] Error states display properly
```

### 5. Error Handling Tests
- [ ] Network failure shows appropriate error
- [ ] 400 Bad Request shows validation errors
- [ ] 404 Not Found handled gracefully
- [ ] 500 Server Error triggers retry logic
- [ ] Rate limiting (429) shows user-friendly message

### 6. Performance Tests
- [ ] Request deduplication works (multiple same requests = 1 network call)
- [ ] Cache prevents unnecessary requests
- [ ] Background refetch doesn't block UI
- [ ] Large payload handling (test with 100+ items)

---

## 💳 Chunk-003: Stripe.js Integration Testing

### 1. Stripe Loading Tests
- [ ] Stripe.js loads asynchronously without blocking page
- [ ] Loading state displays while Stripe initializes
- [ ] Error state shows if Stripe fails to load
- [ ] Stripe object available in window after load

### 2. Provider Integration
```jsx
// Test in _app.tsx or test component
- [ ] StripeProvider wraps app without errors
- [ ] useStripe hook returns stripe instance
- [ ] withStripe HOC prevents rendering until loaded
- [ ] Context provides loading and error states
```

### 3. Environment Configuration
- [ ] Correct publishable key loaded from env
- [ ] Test mode detected in development
- [ ] Production mode works with production key
- [ ] Missing key shows helpful error message

### 4. Checkout Session Tests
```typescript
// Test checkout creation
- [ ] Can create checkout session
- [ ] Redirects to Stripe Checkout page
- [ ] Success URL works correctly
- [ ] Cancel URL returns to app
- [ ] Line items passed correctly
```

### 5. Payment Intent Tests
- [ ] Payment intent creation works
- [ ] Amount calculated correctly (handling cents)
- [ ] Currency set to NGN (Nigerian Naira)
- [ ] Metadata attached properly

### 6. Error Scenarios
- [ ] Invalid API key shows error
- [ ] Network failure handled gracefully
- [ ] Invalid parameters show validation errors
- [ ] Stripe API errors display user-friendly messages

---

## 🎨 Chunk-005: User Pages Layout Testing

### 1. Component Rendering Tests
- [ ] UserLayout renders without errors
- [ ] UserSidebar displays navigation items
- [ ] UserHeader shows user information
- [ ] All components use SCSS modules correctly

### 2. Responsive Design Tests
**Desktop (>1024px)**
- [ ] Sidebar fixed on left side
- [ ] Content area has proper margins
- [ ] Header spans full width
- [ ] Navigation items fully visible

**Tablet (768px - 1024px)**
- [ ] Sidebar becomes narrower
- [ ] Content adjusts to available space
- [ ] Touch targets appropriately sized
- [ ] No horizontal scrolling

**Mobile (<768px)**
- [ ] Sidebar hidden by default
- [ ] Hamburger menu visible
- [ ] Sidebar slides in as overlay
- [ ] Close button/backdrop works
- [ ] Content takes full width

### 3. Navigation Tests
- [ ] Active page highlighted correctly
- [ ] Navigation links work
- [ ] Nested routes supported (/user/subscriptions/[id])
- [ ] Breadcrumbs display correctly
- [ ] Back navigation works

### 4. User Session Integration
- [ ] User name displays correctly
- [ ] User avatar/initial shows
- [ ] Logout functionality works
- [ ] Redirects to login if not authenticated
- [ ] Role-based menu items (if applicable)

### 5. Accessibility Tests
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] ARIA labels present
- [ ] Focus indicators visible
- [ ] Screen reader announces navigation
- [ ] Color contrast meets WCAG AA

### 6. Visual/Styling Tests
- [ ] Brand colors applied correctly (#C52D2F, #F1C40F, #FF6F3C)
- [ ] Hover states work on all interactive elements
- [ ] Transitions smooth (no janky animations)
- [ ] Icons display correctly
- [ ] Typography consistent with design system

### 7. Performance Tests
- [ ] No layout shift on page load
- [ ] Sidebar toggle animates smoothly
- [ ] No unnecessary re-renders
- [ ] CSS modules load correctly
- [ ] Images/icons optimized

---

## 🔄 Integration Tests (Cross-Chunk)

### 1. API + Stripe Integration
- [ ] Can fetch menu items and create Stripe checkout
- [ ] API error doesn't break Stripe functionality
- [ ] Stripe session includes user from API

### 2. API + User Layout Integration
- [ ] User data fetched and displayed in header
- [ ] Loading states show in layout during API calls
- [ ] Error boundaries catch API failures
- [ ] Session timeout handled gracefully

### 3. Stripe + User Layout Integration
- [ ] Payment methods page uses layout correctly
- [ ] Stripe elements render within layout
- [ ] Mobile layout works with Stripe forms
- [ ] Loading states consistent

---

## 🤖 Automated Test Commands

### Unit Tests
```bash
# Run if test files exist
npm test -- --testPathPattern="api-client"
npm test -- --testPathPattern="stripe"
npm test -- --testPathPattern="user-layout"
```

### Component Tests
```bash
# Using React Testing Library
npm test -- --testPathPattern="UserLayout"
npm test -- --testPathPattern="StripeProvider"
```

### E2E Tests (if Cypress/Playwright configured)
```bash
# Basic smoke tests
npm run e2e:test -- --spec="user-layout.spec.ts"
npm run e2e:test -- --spec="api-integration.spec.ts"
npm run e2e:test -- --spec="stripe-flow.spec.ts"
```

---

## 🚦 Manual Testing Flows

### Flow 1: Basic User Navigation
1. [ ] Start at /user/dashboard
2. [ ] Click through each navigation item
3. [ ] Verify active states update
4. [ ] Test on mobile - toggle sidebar
5. [ ] Verify logout works

### Flow 2: API Data Fetching
1. [ ] Navigate to a page that fetches data
2. [ ] Verify loading state shows
3. [ ] Verify data displays correctly
4. [ ] Trigger an error (disconnect network)
5. [ ] Verify error state shows
6. [ ] Reconnect and verify retry works

### Flow 3: Stripe Checkout Flow
1. [ ] Navigate to subscription creation page
2. [ ] Verify Stripe loads
3. [ ] Attempt to create checkout session
4. [ ] Verify redirect to Stripe
5. [ ] Complete test payment
6. [ ] Verify return to success page

---

## 📊 Performance Metrics

### Target Metrics
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Cumulative Layout Shift < 0.1
- [ ] Bundle size increase < 100KB

### How to Measure
```bash
# Lighthouse
npm run build && npm run start
# Open Chrome DevTools > Lighthouse > Generate report

# Bundle analysis
npm run analyze (if configured)
# or
npx next-bundle-analyzer
```

---

## 🐛 Known Issues / Edge Cases to Test

### API Client
- [ ] Concurrent requests don't interfere
- [ ] Large response payloads handled
- [ ] Slow network conditions handled
- [ ] CORS errors handled appropriately

### Stripe
- [ ] 3D Secure authentication flow
- [ ] Declined cards show proper errors
- [ ] Currency conversion displays correctly
- [ ] Subscription with multiple items

### User Layout
- [ ] Long navigation labels don't break layout
- [ ] Very long user names truncate properly
- [ ] Missing user data doesn't crash
- [ ] Rapid sidebar toggling doesn't break

---

## ✅ Sign-off Checklist

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors in browser
- [ ] No React warnings in console

### Functionality
- [ ] All acceptance criteria met
- [ ] All critical paths tested
- [ ] Error scenarios handled
- [ ] Performance acceptable

### Documentation
- [ ] Code comments present where needed
- [ ] README updated if required
- [ ] API documentation current
- [ ] Usage examples provided

### Ready for Next Wave?
- [ ] All blocking issues resolved
- [ ] Dependencies ready for next chunks
- [ ] No regression in existing features
- [ ] Team sign-off obtained

---

## 📝 Test Results Summary

| Chunk | Tests Passed | Tests Failed | Blockers | Ready for Next Wave |
|-------|-------------|--------------|----------|-------------------|
| 001 - API Integration | ___/35 | ___ | | ☐ Yes ☐ No |
| 003 - Stripe.js | ___/24 | ___ | | ☐ Yes ☐ No |
| 005 - User Layout | ___/35 | ___ | | ☐ Yes ☐ No |

**Overall Status:** ☐ PASS ☐ FAIL ☐ BLOCKED

**Tested by:** ________________  
**Date:** ________________  
**Environment:** ☐ Local ☐ Staging ☐ Production

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

1. **TypeScript compilation errors**
   - Check tsconfig.json paths
   - Verify all imports use correct paths
   - Run `npm run type-check`

2. **Stripe not loading**
   - Verify publishable key is set
   - Check network tab for blocked requests
   - Ensure no ad blockers interfering

3. **API requests failing**
   - Check CORS configuration
   - Verify API routes exist
   - Check authentication headers

4. **Layout breaking on mobile**
   - Clear cache and hard refresh
   - Check CSS modules loading
   - Verify viewport meta tag

5. **React Query not caching**
   - Check query keys are stable
   - Verify stale time configuration
   - Check React Query DevTools

---

**Note:** This testing plan should be executed before proceeding to Wave 2 implementation. Any failures should be addressed before launching dependent chunks.