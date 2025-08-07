# LLM Agent Setup Guide - Osassy's Kitchen Application

## Overview
This guide provides comprehensive instructions for LLM agents to get the Osassy's Kitchen Next.js application running from scratch. Follow these steps in order to ensure all services and dependencies are properly configured.

## Prerequisites Check
Before starting, verify these are installed on the system:

### Required Software
- **Node.js** (v18.0.0 or higher)
  ```bash
  node --version 
  npm --version
  ```
- **PostgreSQL** (v12.0 or higher)
  ```bash
  postgres --version
  # or
  psql --version
  ```
- **Git** (for cloning and version control)
  ```bash
  git --version
  ```

### Optional but Recommended
- **Stripe CLI** (for webhook testing)
  ```bash
  stripe --version
  ```

## Step-by-Step Setup Process

### 1. Database Setup
**CRITICAL**: The database must be running before starting the application.

#### Start PostgreSQL Service
```bash
# On macOS (if using Homebrew)
brew services start postgresql

# On Linux (Ubuntu/Debian)
sudo systemctl start postgresql

# On Windows
# Start PostgreSQL service from Services app or command line
```

#### Create Database
```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create the database
CREATE DATABASE osassy_kitchen;

# Create user (if needed)
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE osassy_kitchen TO your_username;

# Exit psql
\q
```

#### Verify Database Connection
```bash
# Test connection with the DATABASE_URL from .env.local
psql "postgresql://admin.paul.idemudia@localhost:5432/osassy_kitchen?schema=public"
```

### 2. Environment Configuration

#### Check .env.local File
Ensure `.env.local` exists with these variables:
```bash
# Database
DATABASE_URL="postgresql://admin.paul.idemudia@localhost:5432/osassy_kitchen?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Stripe (Test Keys)
STRIPE_SECRET_KEY="[YOUR_STRIPE_SECRET_KEY]"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="[YOUR_STRIPE_PUBLISHABLE_KEY]"
STRIPE_WEBHOOK_SECRET="whsec_to_be_configured"

# Email (placeholder for future)
POSTMARK_SERVER_TOKEN="your-postmark-token"
```

### 3. Install Dependencies
```bash
# Install all npm packages
npm install

# Verify installation
npm list --depth=0
```

### 4. Database Migration and Seeding
**CRITICAL**: Must be done in this exact order.

#### Run Prisma Migrations
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Verify migration status
npx prisma migrate status
```

#### Seed the Database
```bash
# Run the seed script
npm run seed

# Verify data was created
npx prisma studio
# This opens a web interface to view database contents
```

### 5. Stripe Configuration (For Subscription Features)

#### Authenticate with Stripe CLI
```bash
stripe login
```

#### Verify Stripe Products Exist
```bash
# List products in your Stripe account
stripe products list

# List prices
stripe prices list
```

#### Current Product IDs (as of setup)
- **Weekly Meal Plan**: `price_1RnpXuQcnp5UiDwRWflK4L2N`
- **Monthly Meal Plan**: `price_1RnpZrQcnp5UiDwRxTfUX1Qs`

### 6. Start the Application

#### Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
✓ Ready in 2.4s
- Local:        http://localhost:3000 (or http://localhost:3001 if 3000 is busy)
- Environments: .env.local, .env
```

### 7. Verification Steps

#### Test Database Connection
```bash
# Check if Prisma can connect
npx prisma db pull
```

#### Test Application Pages
1. **Homepage**: http://localhost:3000
2. **Login**: http://localhost:3000/login
3. **Signup**: http://localhost:3000/signup
4. **Subscribe**: http://localhost:3000/subscribe (requires login)

#### Test Authentication
- Default admin user: `admin@osassyskitchen.com` / `admin123`

#### Test Subscription Flow
1. Login with test user
2. Navigate to `/subscribe`
3. Select a plan
4. Use Stripe test card: `4242 4242 4242 4242`

## Common Issues and Solutions

### Database Issues
```bash
# If connection fails
Error: P1001: Can't reach database server

SOLUTIONS:
1. Check if PostgreSQL is running: brew services list | grep postgresql
2. Verify DATABASE_URL in .env.local
3. Ensure database exists: psql -l | grep osassy_kitchen
4. Check user permissions
```

### Port Issues
```bash
# If port 3000 is busy
⚠ Port 3000 is in use, trying 3001 instead.

SOLUTION: Use the alternative port or kill existing process:
lsof -ti:3000 | xargs kill -9
```

### Stripe Issues
```bash
# If getting "No such price" errors
ERROR: No such price: 'price_xxxxx'

SOLUTIONS:
1. Verify Stripe CLI authentication: stripe config --list
2. Check price IDs match: stripe prices list
3. Ensure correct API keys in .env.local
```

### Migration Issues
```bash
# If migrations fail
ERROR: Migration failed

SOLUTIONS:
1. Reset database: npx prisma migrate reset
2. Generate client: npx prisma generate
3. Re-run migrations: npx prisma migrate dev
```

## Service Startup Checklist

Before running `npm run dev`, ensure:
- [ ] PostgreSQL service is running
- [ ] Database `osassy_kitchen` exists
- [ ] `.env.local` has all required variables
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Migrations applied (`npx prisma migrate dev`)
- [ ] Database seeded (`npm run seed`)
- [ ] No processes using port 3000/3001

## Advanced Setup (Optional)

### Stripe Webhook Listener
For testing subscription webhooks:
```bash
# In a separate terminal
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret to .env.local
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

### Production Build Test
```bash
# Build application
npm run build

# Start production server
npm start
```

## Architecture Notes
- **Framework**: Next.js 14 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Payments**: Stripe with React Stripe.js
- **Styling**: SCSS with Bootstrap components

## File Structure Reference
```
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.js               # Database seeding
│   └── migrations/           # Database migrations
├── src/
│   ├── pages/
│   │   ├── api/              # API routes
│   │   ├── subscribe.tsx     # Subscription page
│   │   └── ...
│   ├── components/           # React components
│   ├── lib/                  # Utility libraries
│   └── styles/               # SCSS styles
├── .env.local                # Environment variables
└── package.json              # Dependencies and scripts
```

## Support Information
- **Database Schema**: See `prisma/schema.prisma`
- **API Endpoints**: See `src/pages/api/`
- **Progress Log**: See `planning/PROGRESS_LOG.md`
- **Phase Documentation**: See `planning/phase-*-implementation-plan.md`

---
*This guide should get any LLM agent from zero to a running Osassy's Kitchen application. If issues persist, check the specific phase documentation for more detailed troubleshooting.*
