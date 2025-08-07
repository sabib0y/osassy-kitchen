#!/usr/bin/env node

/**
 * Script to create Stripe subscription prices for Osassy Kitchen
 * Run this script to set up the necessary price objects in Stripe
 * 
 * Usage: node scripts/setup-stripe-prices.js
 */

const Stripe = require('stripe');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not set in .env.local');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-06-30.basil',
});

async function createStripeProduct() {
  try {
    // Check if product already exists
    const existingProducts = await stripe.products.list({
      limit: 100,
    });

    let product = existingProducts.data.find(
      p => p.metadata?.app === 'osassy_kitchen' && p.metadata?.type === 'subscription'
    );

    if (!product) {
      // Create the main subscription product
      product = await stripe.products.create({
        name: 'Osassy Kitchen Meal Subscription',
        description: 'Customisable Nigerian meal subscription service with weekly or monthly delivery',
        metadata: {
          app: 'osassy_kitchen',
          type: 'subscription',
        },
      });
      console.log('✅ Created Stripe product:', product.id);
    } else {
      console.log('ℹ️  Using existing Stripe product:', product.id);
    }

    return product;
  } catch (error) {
    console.error('❌ Error creating product:', error);
    throw error;
  }
}

async function createStripePrices(productId) {
  const priceConfigs = [
    {
      nickname: 'Weekly Subscription',
      unit_amount: 15000, // ₦150.00 in kobo (smallest currency unit)
      recurring: {
        interval: 'week',
      },
      metadata: {
        description: 'Weekly delivery of your selected Nigerian meals',
        plan_type: 'weekly',
      },
    },
    {
      nickname: 'Monthly Subscription',
      unit_amount: 50000, // ₦500.00 in kobo
      recurring: {
        interval: 'month',
      },
      metadata: {
        description: 'Monthly delivery of your selected Nigerian meals',
        plan_type: 'monthly',
      },
    },
  ];

  const createdPrices = [];

  for (const config of priceConfigs) {
    try {
      // Check if price already exists
      const existingPrices = await stripe.prices.list({
        product: productId,
        limit: 100,
      });

      const existingPrice = existingPrices.data.find(
        p => p.metadata?.plan_type === config.metadata.plan_type
      );

      if (existingPrice) {
        console.log(`ℹ️  Price already exists for ${config.nickname}:`, existingPrice.id);
        createdPrices.push(existingPrice);
      } else {
        const price = await stripe.prices.create({
          product: productId,
          nickname: config.nickname,
          currency: 'ngn', // Nigerian Naira
          unit_amount: config.unit_amount,
          recurring: config.recurring,
          metadata: config.metadata,
        });

        console.log(`✅ Created price for ${config.nickname}:`, price.id);
        createdPrices.push(price);
      }
    } catch (error) {
      console.error(`❌ Error creating price for ${config.nickname}:`, error);
    }
  }

  return createdPrices;
}

async function main() {
  console.log('🚀 Setting up Stripe prices for Osassy Kitchen...\n');

  try {
    // Step 1: Create or get the product
    const product = await createStripeProduct();

    // Step 2: Create prices
    const prices = await createStripePrices(product.id);

    // Step 3: Output the price IDs for use in the application
    console.log('\n📋 Summary:');
    console.log('============================================');
    console.log('Product ID:', product.id);
    console.log('\nPrice IDs to use in your application:');
    console.log('--------------------------------------------');
    
    const weeklyPrice = prices.find(p => p.metadata?.plan_type === 'weekly');
    const monthlyPrice = prices.find(p => p.metadata?.plan_type === 'monthly');

    if (weeklyPrice) {
      console.log(`Weekly Subscription: ${weeklyPrice.id}`);
    }
    if (monthlyPrice) {
      console.log(`Monthly Subscription: ${monthlyPrice.id}`);
    }

    console.log('\n💡 Update these price IDs in your subscription creation page:');
    console.log('src/pages/subscriptions/create.tsx');
    console.log('\nconst priceId = billingInterval === "WEEKLY"');
    console.log(`  ? '${weeklyPrice?.id}' // Weekly subscription`);
    console.log(`  : '${monthlyPrice?.id}'; // Monthly subscription`);
    
    console.log('\n✨ Stripe setup complete!');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);