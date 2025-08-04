# Phase 4 UI Design Prompts - Osassy's Kitchen Dashboard

## Overview
This document contains detailed prompts for generating the frontend interfaces needed for Phase 4. Each prompt is designed to work with the existing backend APIs and provide comprehensive user experiences.

---

## 1. User Dashboard/Profile Page Prompt

### Prompt for User Dashboard
```
Create a comprehensive user dashboard for Osassy's Kitchen meal subscription service. This is a Nigerian food delivery platform where users manage their meal subscriptions.

**Core Requirements:**
- Display user's active subscriptions with full details (plan type, items, next delivery date)
- Show order history with filtering (by status, date range)
- Allow subscription management (pause, cancel, modify items)
- Account settings section
- Payment method management
- Responsive design for mobile/desktop

**Data Structure:**
- Use /api/user/subscriptions endpoint for subscription data
- Use /api/user/orders endpoint for order history
- Include subscription items with menu details
- Show delivery scheduling

**Visual Style:**
- Modern, clean interface with Nigerian cultural elements
- Warm color palette (oranges, browns, greens)
- Card-based layout for subscriptions and orders
- Clear status indicators (active, paused, cancelled)
- Mobile-first responsive design

**Key Features:**
- Subscription cards showing: plan name, items list, next delivery, status
- Order timeline with status progression
- Quick actions: modify subscription, view details, cancel
- Account info section with editable fields
- Payment methods display and management

**Technical Notes:**
- Use Next.js with TypeScript
- Integrate with existing NextAuth.js authentication
- Use React Query or SWR for data fetching
- Include loading states and error handling
- Follow existing project structure
```

---

## 2. Enhanced Admin Dashboard Prompt

### Prompt for Professional Admin Interface
```
Create a comprehensive admin dashboard for Osassy's Kitchen meal subscription management. This is the control center for managing all business operations.

**Core Requirements:**
- Real-time business analytics and KPIs
- Order management with advanced filtering and search
- Subscription management across all users
- Menu item CRUD operations with usage statistics
- User management capabilities
- Revenue tracking and reporting

**Data Structure:**
- Use /api/admin/dashboard for analytics
- Use /api/admin/orders for order management
- Use /api/admin/subscriptions for subscription management
- Use /api/admin/menu-items for menu operations

**Visual Style:**
- Professional admin interface with dark/light theme toggle
- Data tables with sorting, filtering, pagination
- Charts and graphs for analytics (Recharts library)
- Status badges and color coding
- Responsive sidebar navigation
- Mobile-friendly design

**Key Features:**
- Dashboard overview: revenue, subscriptions, orders, users
- Order management: status updates, filtering, search, bulk actions
- Subscription management: view all, modify status, user details
- Menu management: add/edit/delete items, view usage stats
- User management: view user details, subscription history
- Analytics: revenue trends, popular items, growth metrics

**Technical Notes:**
- Use Next.js with TypeScript
- Implement role-based access control (ADMIN only)
- Use React Table for data grids
- Include export functionality (CSV, PDF)
- Real-time updates with polling or WebSocket
- Error boundaries and loading states
```

---

## 3. User Subscription Management Interface Prompt

### Prompt for Subscription Management
```
Create a dedicated subscription management interface for users to control their meal subscriptions on Osassy's Kitchen.

**Core Requirements:**
- View all active subscriptions with detailed information
- Modify subscription items and quantities
- Pause/resume subscriptions
- Cancel subscriptions with confirmation
- View upcoming delivery schedule
- Change delivery preferences

**Data Structure:**
- Display subscription details: plan type, items, quantities, price
- Show delivery calendar with upcoming dates
- Include subscription history and status changes
- Payment information and billing cycle

**Visual Style:**
- Clean, intuitive interface
- Card-based subscription display
- Interactive item modification
- Calendar view for deliveries
- Confirmation modals for destructive actions
- Mobile-optimized design

**Key Features:**
- Subscription cards with: plan name, items list, next delivery, price
- Item modification: add/remove items, change quantities
- Delivery scheduling: view calendar, change delivery day
- Status management: pause, resume, cancel with reasons
- Payment info: next billing date, payment method
- History: past deliveries, status changes

**Technical Notes:**
- Use Next.js with TypeScript
- Integrate with /api/user/subscriptions endpoint
- Include optimistic updates for better UX
- Form validation for item modifications
- Loading states and error handling
```

---

## 4. Order Management Interface Prompt

### Prompt for Order Management System
```
Create a comprehensive order management interface for both users and admins on Osassy's Kitchen.

**User-Facing Requirements:**
- View order history with detailed information
- Track order status in real-time
- View delivery details and tracking
- Rate/review completed orders
- Reorder favorite items

**Admin-Facing Requirements:**
- View all orders with advanced filtering
- Update order status (PENDING → IN_PROGRESS → DELIVERED)
- Add delivery notes and special instructions
- Assign delivery personnel
- Handle order issues and refunds
- Generate order reports

**Data Structure:**
- Order details: items, quantities, prices, delivery info
- Status tracking with timestamps
- User information and delivery preferences
- Payment and billing information

**Visual Style:**
- Timeline view for order status progression
- Card-based order display
- Status badges with color coding
- Filter sidebar for admin interface
- Mobile-responsive design

**Key Features:**
- Order cards with: order number, items, total, status, delivery date
- Status timeline showing progression
- Filter and search functionality
- Bulk actions for admin (update multiple orders)
- Export functionality for reports
- Real-time status updates

**Technical Notes:**
- Use Next.js with TypeScript
- Integrate with /api/user/orders and /api/admin/orders
- Real-time updates with polling
- Include order modification capabilities
- Comprehensive error handling
```

---

## 5. Menu Item Management Interface Prompt

### Prompt for Menu Management
```
Create a menu item management interface for admins to manage the Nigerian food menu on Osassy's Kitchen.

**Core Requirements:**
- Full CRUD operations for menu items
- Upload and manage food images
- Set pricing and availability
- View usage statistics (how many subscriptions include each item)
- Bulk operations for multiple items
- Category management

**Data Structure:**
- Menu item details: name, description, price, image, category
- Availability status (available/unavailable)
- Usage statistics from subscriptions
- Category organization

**Visual Style:**
- Grid view for menu items with images
- Form interface for adding/editing items
- Drag-and-drop image upload
- Status indicators for availability
- Usage statistics display

**Key Features:**
- Menu item grid with images, prices, availability
- Add new items with image upload
- Edit existing items with preview
- Soft delete (mark as unavailable)
- Usage stats: "Used in 15 active subscriptions"
- Category filtering and organization

**Technical Notes:**
- Use Next.js with TypeScript
- Integrate with /api/admin/menu-items
- Image upload and optimization
- Form validation and error handling
- Responsive grid layout
```

---

## Implementation Priority

1. **User Dashboard** - Essential for user experience
2. **Enhanced Admin Dashboard** - Critical for business operations
3. **Subscription Management** - Key for user retention
4. **Order Management** - Important for operational efficiency
5. **Menu Management** - Needed for content management

## Technical Stack Recommendations

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Charts**: Recharts for analytics
- **Tables**: React Table for data grids
- **Forms**: React Hook Form with validation
- **State**: React Query for data fetching
- **UI Library**: Headless UI for accessible components
- **Icons**: Lucide React for consistent iconography

## Color Palette Guidelines

**User Interface:**
- Primary: Warm orange (#FF6B35)
- Secondary: Rich brown (#8B4513)
- Accent: Fresh green (#228B22)
- Background: Warm cream (#FFF8F0)
- Text: Dark brown (#2F1B14)

**Admin Interface:**
- Primary: Professional blue (#2563EB)
- Secondary: Slate gray (#475569)
- Accent: Emerald green (#10B981)
- Background: Light gray (#F8FAFC)
- Text: Dark gray (#1E293B)
