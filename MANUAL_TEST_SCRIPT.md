# Manual Test Script - Osassy's Kitchen

## Quick Start
```bash
npm run dev  # Start the app at http://localhost:3000
```

---

## 🟢 HAPPY PATHS

### 1. Homepage & Navigation
- [ ] Visit `/` - Homepage loads with hero carousel
- [ ] Hero carousel auto-rotates every 5.5 seconds
- [ ] "Start Your Meal Plan" CTA button is visible and clickable
- [ ] "Why Choose Osassy's Kitchen?" section displays with dark theme
- [ ] Cards have red border on hover
- [ ] "How It Works" section shows 3 cards
- [ ] "Popular Dishes" section shows food images
- [ ] "Delivered Across London" section shows map background
- [ ] Footer links are all functional
- [ ] Navigation menu items work (Our Process, Our Menu, Meal Plans)

### 2. User Registration (Happy Path)
- [ ] Visit `/signup`
- [ ] Enter valid name: "Test User"
- [ ] Enter valid email: "newuser@test.com"
- [ ] Enter valid password: "Password123!"
- [ ] Confirm password matches
- [ ] Click "Sign Up"
- [ ] Redirected to `/user/dashboard` or `/login`
- [ ] Success message displayed

### 3. User Login (Happy Path)
- [ ] Visit `/login`
- [ ] Enter valid email: `test@test.com`
- [ ] Enter valid password: `password123`
- [ ] Click "Sign In"
- [ ] Redirected to `/user/dashboard`
- [ ] User name displayed in header/dashboard

### 4. User Dashboard
- [ ] Visit `/user/dashboard` (while logged in)
- [ ] Dashboard overview displays
- [ ] Quick action buttons visible
- [ ] Recent orders section visible
- [ ] Active subscriptions summary visible

### 5. Create Subscription (Happy Path)
- [ ] Visit `/subscriptions/create`
- [ ] Select a meal plan (Weekly/Monthly)
- [ ] Choose meals from the menu
- [ ] Review order summary
- [ ] Proceed to checkout
- [ ] Complete Stripe payment (use test card: `4242 4242 4242 4242`)
- [ ] Redirected to success page
- [ ] Subscription appears in `/user/subscriptions`

### 6. Manage Subscription
- [ ] Visit `/user/subscriptions`
- [ ] Click on an active subscription
- [ ] View subscription details
- [ ] Click "Pause Subscription" - status changes to PAUSED
- [ ] Click "Resume Subscription" - status changes to ACTIVE
- [ ] Click "Skip Next Delivery" - confirmation shown
- [ ] Modify delivery preferences

### 7. View Orders
- [ ] Visit `/user/orders`
- [ ] Order history displayed
- [ ] Click on an order to view details
- [ ] Order status visible (Pending/In Progress/Delivered)
- [ ] Delivery date visible

### 8. User Profile
- [ ] Visit `/user/profile`
- [ ] View current profile information
- [ ] Edit name - changes saved
- [ ] Edit phone number - changes saved
- [ ] Edit delivery address - changes saved
- [ ] Upload profile photo - image displays

### 9. Admin Login (Happy Path)
- [ ] Visit `/login`
- [ ] Enter admin email: `osasp419@gmail.com`
- [ ] Enter admin password: (your admin password)
- [ ] Click "Sign In"
- [ ] Redirected to `/admin/dashboard`

### 10. Admin Dashboard
- [ ] Visit `/admin/dashboard`
- [ ] Analytics overview displays
- [ ] Total orders count visible
- [ ] Active subscriptions count visible
- [ ] Revenue metrics displayed
- [ ] Recent orders list visible

### 11. Admin Menu Management
- [ ] Visit `/admin/menu`
- [ ] View list of menu items
- [ ] Click "Add New Item"
- [ ] Fill in dish details (name, price, description, image)
- [ ] Save - new item appears in list
- [ ] Edit existing item - changes saved
- [ ] Toggle item availability - status updates

### 12. Admin Order Management
- [ ] Visit `/admin/orders`
- [ ] View all orders
- [ ] Filter by status (Pending/In Progress/Delivered)
- [ ] Click on an order to view details
- [ ] Update order status - change reflected
- [ ] View customer information

### 13. Logout
- [ ] Click logout button in header/menu
- [ ] Redirected to `/login` or `/`
- [ ] Protected routes no longer accessible

---

## 🔴 SAD PATHS (Error Handling)

### 1. Registration Errors
- [ ] Submit empty form - validation errors shown
- [ ] Enter invalid email format - "Invalid email" error
- [ ] Enter short password (<8 chars) - password requirement error
- [ ] Mismatched passwords - "Passwords don't match" error
- [ ] Register with existing email - "Email already exists" error

### 2. Login Errors
- [ ] Submit empty form - validation errors shown
- [ ] Enter non-existent email - "Invalid credentials" error
- [ ] Enter wrong password - "Invalid credentials" error
- [ ] Too many failed attempts - account locked message (if implemented)

### 3. Unauthorised Access
- [ ] Visit `/user/dashboard` while logged out - redirected to `/login`
- [ ] Visit `/admin/dashboard` as regular user - redirected to `/unauthorized`
- [ ] Visit `/admin/menu` as regular user - redirected to `/unauthorized`
- [ ] Access `/user/subscriptions/[id]` with invalid ID - 404 or error page

### 4. Subscription Errors
- [ ] Try to create subscription without selecting meals - validation error
- [ ] Try to checkout with empty cart - error message
- [ ] Cancel Stripe payment mid-flow - redirected to cancel page
- [ ] Use declined card (`4000 0000 0000 0002`) - payment failure message

### 5. Profile Update Errors
- [ ] Submit empty required fields - validation errors
- [ ] Enter invalid phone format - validation error
- [ ] Upload invalid file type for photo - error message
- [ ] Upload oversized image - error message

### 6. Admin Errors
- [ ] Add menu item without required fields - validation errors
- [ ] Add menu item with negative price - validation error
- [ ] Delete item that's part of active subscriptions - warning/error
- [ ] Update order to invalid status - error message

### 7. Network/Server Errors
- [ ] Disconnect internet, submit form - graceful error handling
- [ ] API timeout - loading state then error message
- [ ] Server 500 error - user-friendly error page

### 8. Session Expiry
- [ ] Leave tab idle for extended period
- [ ] Attempt action after session expires - redirected to login
- [ ] "Session expired" message displayed

---

## 🧪 STRIPE TEST CARDS

| Scenario | Card Number |
|----------|-------------|
| Success | `4242 4242 4242 4242` |
| Declined | `4000 0000 0000 0002` |
| Insufficient funds | `4000 0000 0000 9995` |
| Expired card | `4000 0000 0000 0069` |
| Incorrect CVC | `4000 0000 0000 0127` |

**For all test cards:**
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- Postcode: Any valid format

---

## 📱 RESPONSIVE TESTING

Test these breakpoints:
- [ ] Desktop: 1920px width
- [ ] Laptop: 1280px width
- [ ] Tablet: 768px width
- [ ] Mobile: 375px width

Check on each:
- [ ] Navigation collapses to hamburger menu on mobile
- [ ] Cards stack vertically on smaller screens
- [ ] Text remains readable
- [ ] Buttons are tap-friendly (min 44px)
- [ ] No horizontal scroll

---

## ✅ TEST ACCOUNTS

| Role | Email | Password |
|------|-------|----------|
| User | `test@test.com` | `password123` |
| Admin | `osasp419@gmail.com` | (your password) |

---

## 📝 NOTES

- Clear browser cache/cookies between test sessions if needed
- Check browser console for JavaScript errors
- Note any slow loading times (>3 seconds)
- Screenshot any bugs found

**Last Updated:** March 8, 2026
