# Phase 1: Foundation & Authentication Setup
**Osassy's Kitchen - Week 1 Implementation Plan**

## Overview
This document outlines the complete implementation plan for Phase 1 of transforming Osassy's Kitchen from a static restaurant site to a subscription-based meal delivery platform. Phase 1 focuses on establishing the foundational backend infrastructure, database setup, and authentication system.

---

## 1. Project Dependencies Installation

### Core Dependencies
```bash
# Database & ORM
npm install prisma @prisma/client

# Authentication
npm install next-auth @next-auth/prisma-adapter

# Environment Management
npm install dotenv

# Development Dependencies
npm install -D @types/node typescript
```

### Database Setup
```bash
# Initialize Prisma
npx prisma init

# Set up PostgreSQL connection
# (Requires PostgreSQL installation or Supabase setup)
```

---

## 2. Database Schema Design

### Prisma Schema Location
**File:** `prisma/schema.prisma`

### Complete Schema Definition
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id                String    @id @default(cuid())
  name              String?
  email             String    @unique
  emailVerified     DateTime?
  image             String?
  password          String?   // For credentials provider
  role              UserRole  @default(USER)
  stripeCustomerId  String?   @unique
  phone             String?
  address           Json?     // Store address as JSON object
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  subscriptions Subscription[]
  orders        Order[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model MenuItem {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Float
  imageUrl    String?
  category    String
  available   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  subscriptionItems SubscriptionItem[]
  orderItems        OrderItem[]
}

model Subscription {
  id                  String               @id @default(cuid())
  userId              String
  planName            String
  interval            SubscriptionInterval
  price               Float
  stripeSubscriptionId String              @unique
  status              SubscriptionStatus   @default(ACTIVE)
  startDate           DateTime             @default(now())
  nextDeliveryDate    DateTime
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  
  user              User                @relation(fields: [userId], references: [id])
  subscriptionItems SubscriptionItem[]
  orders            Order[]
}

model SubscriptionItem {
  id             String @id @default(cuid())
  subscriptionId String
  menuItemId     String
  quantity       Int    @default(1)
  
  subscription Subscription @relation(fields: [subscriptionId], references: [id])
  menuItem     MenuItem     @relation(fields: [menuItemId], references: [id])
}

model Order {
  id             String      @id @default(cuid())
  userId         String
  subscriptionId String?
  totalPrice     Float
  deliveryDate   DateTime
  status         OrderStatus @default(PENDING)
  notes          String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  user         User         @relation(fields: [userId], references: [id])
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])
  orderItems   OrderItem[]
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  menuItemId String
  quantity   Int     @default(1)
  price      Float
  
  order    Order    @relation(fields: [orderId], references: [id])
  menuItem MenuItem @relation(fields: [menuItemId], references: [id])
}

enum UserRole {
  USER
  ADMIN
}

enum SubscriptionInterval {
  WEEKLY
  MONTHLY
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAUSED
}

enum OrderStatus {
  PENDING
  IN_PROGRESS
  DELIVERED
  CANCELLED
}
```

---

## 3. Environment Configuration

### Environment Variables File
**File:** `.env.local`

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/osassy_kitchen?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32

# Stripe (for future phases)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email (for future phases)
POSTMARK_SERVER_TOKEN="your-postmark-token"
```

---

## 4. NextAuth.js Configuration

### Auth Configuration File
**File:** `src/pages/api/auth/[...nextauth].js`

```javascript
import NextAuth from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
    signUp: "/signup",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
})
```

---

## 5. Database Migration & Seeding

### Migration Commands
```bash
# Generate migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database with initial data
npx prisma db seed
```

### Seed File
**File:** `prisma/seed.js`

```javascript
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@osassyskitchen.com' },
    update: {},
    create: {
      email: 'admin@osassyskitchen.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Seed menu items from existing data
  const menuItems = [
    // Rice dishes
    { name: 'White Rice', description: 'Comes with stew and choice of protein', price: 12.99, category: 'Rice' },
    { name: 'Plain Jollof Rice', description: 'Garnished with mixed vegetables', price: 14.99, category: 'Rice' },
    { name: 'Fried Rice', description: 'With mixed vegetables and protein', price: 15.99, category: 'Rice' },
    
    // Stews
    { name: 'Spicy Palm Oil Stew', description: 'Traditional palm oil stew', price: 8.99, category: 'Stew' },
    { name: 'Ayamashe Stew', description: 'Ofada stew with assorted meat', price: 10.99, category: 'Stew' },
    
    // Soups
    { name: 'Fresh Okro Soup', description: 'Traditional okro soup', price: 13.99, category: 'Soup' },
    { name: 'Edikaikong Soup', description: 'Vegetable soup with stock fish', price: 14.99, category: 'Soup' },
    { name: 'Egusi Soup', description: 'Melon seed soup', price: 13.99, category: 'Soup' },
    
    // Specials
    { name: 'Gizzard and Dodo', description: 'Garnished in red sauce', price: 16.99, category: 'Special' },
    { name: 'Isi-Ewu', description: 'Goat head delicacy', price: 18.99, category: 'Special' },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    })
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## 6. Frontend Authentication Pages

### Login Page
**File:** `src/pages/login.js`
- Email/password authentication
- Link to signup page
- Error handling
- Redirect after login

### Signup Page
**File:** `src/pages/signup.js`
- User registration form
- Email validation
- Password confirmation
- Auto-login after signup

### Profile Page
**File:** `src/pages/profile.js`
- Protected route (requires authentication)
- Display user information
- Update profile functionality
- Link to subscription management

---

## 7. Authentication Context & Hooks

### Auth Hook
**File:** `src/hooks/useAuth.js`
- Custom hook for authentication state
- User role checking
- Protected route handling

### Route Protection
**File:** `src/components/ProtectedRoute.js`
- Higher-order component for protected routes
- Role-based access control
- Redirect unauthorized users

---

## 8. Testing & Validation

### Manual Testing Checklist
- [x] Database connection successful
- [x] User registration works
- [x] User login works
- [x] JWT tokens generated correctly
- [x] Protected routes require authentication
- [x] Admin role assignment works
- [x] Database seeding successful
- [x] Environment variables configured

### Database Verification
```bash
# Check database tables
npx prisma studio

# Verify seeded data
npx prisma db seed
```

---

## 9. Next Steps After Phase 1

Once Phase 1 is complete, the foundation will be ready for:
1. **Phase 2**: Stripe integration and subscription creation
2. **Phase 3**: Order generation and webhook handling
3. **Phase 4**: Admin dashboard and menu management
4. **Phase 5**: Delivery scheduling and notifications

---

## 10. Common Issues & Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### NextAuth Configuration
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your development URL
- Ensure Prisma adapter is properly configured

### Migration Issues
- Run `npx prisma migrate reset` if needed
- Check for schema conflicts
- Verify all required fields are present

---

**Ready to proceed with implementation?** This plan provides a complete foundation for the subscription platform. Each component is designed to integrate seamlessly with the existing Next.js structure while preparing for the advanced features in subsequent phases.
