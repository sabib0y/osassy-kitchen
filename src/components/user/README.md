# User Pages Layout Components

This directory contains reusable layout components for user-facing pages in Osassy's Kitchen application.

## Components Overview

### 1. UserLayout.tsx
The main layout wrapper that provides consistent structure for all user pages.

**Features:**
- Session authentication and routing protection
- Background patterns and theming
- Mobile overlay for sidebar
- Loading states
- SEO-friendly head tags
- Keyboard navigation support (Escape to close sidebar)

**Props:**
```typescript
interface UserLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;           // Default: 'User Dashboard - Osassy's Kitchen'
  activeTab?: string;           // For sidebar highlighting
  showSidebar?: boolean;        // Default: true
}
```

### 2. UserSidebar.tsx
Responsive navigation sidebar with user information and menu items.

**Features:**
- User profile display with avatar
- Active page highlighting
- Smooth animations and transitions
- Quick action buttons (New Subscription, Browse Menu)
- Support link
- Mobile-friendly collapsible design
- Accessibility support (ARIA labels, keyboard navigation)

**Navigation Items:**
- Overview (Dashboard)
- Subscriptions
- Orders  
- Profile
- Payments

### 3. UserHeader.tsx
Header component with user actions, notifications, and page information.

**Features:**
- Dynamic page titles with breadcrumbs
- Mobile menu toggle button
- Notification system with dropdown
- User profile dropdown with actions
- Quick action buttons
- Responsive design

**Props:**
```typescript
interface UserHeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;     // Default: true
}
```

## Styling

### user-layout.module.scss
Comprehensive SCSS module following Osassy's Kitchen brand guidelines.

**Brand Colors:**
- Primary: #C52D2F (deep red)
- Secondary: #F1C40F (warm yellow)  
- Accent: #FF6F3C (bright orange)
- Text Dark: #1E1E1E
- Text Light: #FFFFFF

**Key Features:**
- Mobile-first responsive design
- Smooth animations and transitions
- Consistent spacing and typography
- Hover states and micro-interactions
- Accessibility-friendly focus states

**Responsive Breakpoints:**
- Desktop: > 1024px (default layout)
- Tablet: ≤ 1024px (stacked layout, fixed sidebar)
- Mobile: ≤ 768px (optimized spacing and typography)
- Small Mobile: ≤ 480px (full-width sidebar, compact elements)

## Integration Guide

### Basic Usage

```tsx
import UserLayout from '../components/user/UserLayout';

const MyUserPage: React.FC = () => {
  return (
    <UserLayout pageTitle="My Page - Osassy's Kitchen" activeTab="subscriptions">
      <div>
        {/* Your page content here */}
      </div>
    </UserLayout>
  );
};
```

### Migrating from Existing Dashboard

1. **Replace Layout wrapper:**
   ```tsx
   // Before
   <Layout pageTitle="Dashboard">
     <div className={styles.dashboard}>
       {/* content */}
     </div>
   </Layout>

   // After  
   <UserLayout pageTitle="Dashboard" activeTab="overview">
     {/* content (remove dashboard container div) */}
   </UserLayout>
   ```

2. **Extract tab content to separate components:**
   ```tsx
   // Create separate page components for each tab
   // e.g., /user/subscriptions, /user/orders, etc.
   ```

3. **Update routing:**
   ```tsx
   // The sidebar automatically handles navigation
   // based on current route patterns
   ```

## File Structure

```
src/components/user/
├── UserLayout.tsx        # Main layout wrapper
├── UserSidebar.tsx       # Navigation sidebar  
├── UserHeader.tsx        # Header with actions
└── README.md            # This documentation

src/styles/
└── user-layout.module.scss  # Component styles
```

## Accessibility Features

- **Keyboard Navigation:** Full support for Tab, Enter, Escape keys
- **ARIA Labels:** Proper labeling for screen readers
- **Focus Management:** Logical focus order and visible focus indicators
- **Semantic HTML:** Proper use of nav, main, aside, button elements
- **Color Contrast:** WCAG 2.1 AA compliant color schemes

## Mobile Responsiveness

### Desktop (> 1024px)
- Sidebar fixed on left (300px width)
- Full header with all features visible
- Optimal spacing and typography

### Tablet (≤ 1024px)  
- Sidebar converts to overlay/drawer
- Header becomes more compact
- Touch-friendly button sizes

### Mobile (≤ 768px)
- Full-screen sidebar overlay
- Condensed header with essential actions
- Optimized typography and spacing
- Swipe gestures supported

### Small Mobile (≤ 480px)
- Full viewport sidebar
- Minimal header layout
- Compact navigation items
- Single-column layouts

## Performance Considerations

- **Code Splitting:** Components are lazy-loaded where appropriate
- **Image Optimization:** Uses Next.js Image component recommendations
- **CSS Optimization:** SCSS modules for component-scoped styles
- **Animation Performance:** Hardware-accelerated transitions
- **Bundle Size:** Minimal external dependencies

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile Safari (iOS 13+)
- Chrome Mobile (Android 8+)

## Testing

The components include:
- TypeScript strict mode compliance
- ESLint rule compliance  
- Responsive design testing across breakpoints
- Keyboard navigation testing
- Screen reader compatibility

## Future Enhancements

Potential improvements for future iterations:
- Dark mode support
- Customizable themes
- Advanced notification system
- Offline support indicators
- Progressive Web App features