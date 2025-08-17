# Lums Kitchen Application Site Map

## 🌐 Public Pages (Unauthenticated)
| Route | Description | Key Features |
|-------|-------------|--------------|
| `/` | Landing Page | Hero, Features, Testimonials |
| `/login` | Login Page | Email/Password form |
| `/signup` | Sign Up Page | Registration form |
| `/blog` | Blog Listing | Article previews |
| `/blog-details` | Blog Article | Full article view |
| `/unauthorized` | 401 Error | Access denied message |

## 👤 User Dashboard (Authenticated)
| Route | Description | Key Features |
|-------|-------------|--------------|
| `/user/dashboard` | User Dashboard | Overview, quick actions |
| `/user/subscriptions` | My Subscriptions | Active plans, management |
| `/user/subscriptions/[id]` | Subscription Details | Plan info, modify/cancel |
| `/subscriptions/create` | Create Subscription | Plan selection, checkout |
| `/user/orders` | Order History | Past orders, reorder |
| `/user/payments` | Payment Methods | Cards, billing info |
| `/user/profile` | User Profile | Personal info, preferences |

## 👨‍💼 Admin Dashboard (Admin Only)
| Route | Description | Key Features |
|-------|-------------|--------------|
| `/admin/dashboard` | Admin Dashboard | Analytics, overview |
| `/admin/menu` | Menu Management | Add/edit/delete items |
| `/admin/orders` | Order Management | Process orders, status |

## 💳 Payment Flow
| Route | Description | Key Features |
|-------|-------------|--------------|
| `/test-stripe` | Stripe Test Page | Payment testing |
| `/success` | Payment Success | Confirmation page |
| `/cancel` | Payment Cancelled | Cancellation message |

## 🎨 Design System

### Brand Colors
- **Primary**: #C52D2F (Deep Red)
- **Secondary**: #F1C40F (Warm Yellow)
- **Accent**: #FF6F3C (Bright Orange)
- **Background**: #F9F9F9
- **Text**: #333333

### Typography
- **Font**: Inter, system-ui
- **Headings**: Bold, consistent sizing
- **Body**: Regular weight, readable

### Components
- **Buttons**: Primary, secondary, ghost variants
- **Forms**: Input fields, selects, checkboxes
- **Cards**: Content containers with shadows
- **Modals**: Overlay dialogs
- **Navigation**: Header, sidebar, breadcrumbs
- **Tables**: Data display with sorting
- **Alerts**: Success, warning, error states

## 🧭 Navigation Structure

```
Root (/)
├── Public
│   ├── Login
│   ├── Signup
│   ├── Blog
│   │   └── Blog Details
│   └── Unauthorized
│
├── User (Authenticated)
│   ├── Dashboard
│   ├── Subscriptions
│   │   ├── List
│   │   ├── Details ([id])
│   │   └── Create New
│   ├── Orders
│   ├── Payments
│   └── Profile
│
└── Admin (Admin Role)
    ├── Dashboard
    ├── Menu Management
    └── Order Management
```

## 📱 Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔐 Authentication Flow
1. User visits protected route → Redirect to `/login`
2. Successful login → Redirect to `/user/dashboard` or intended page
3. Admin login → Access to admin routes
4. Logout → Clear session, redirect to `/`

## 📦 API Endpoints (Main)
- `/api/auth/*` - Authentication endpoints
- `/api/user/*` - User management
- `/api/subscriptions/*` - Subscription management
- `/api/orders/*` - Order processing
- `/api/menu/*` - Menu items
- `/api/payments/*` - Payment processing
- `/api/admin/*` - Admin operations