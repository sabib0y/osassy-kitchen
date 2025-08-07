const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestSubscription() {
  try {
    console.log('🚀 Creating test subscription...\n');

    // Find test user
    const user = await prisma.user.findUnique({
      where: { email: 'test@test.com' }
    });

    if (!user) {
      console.error('❌ Test user not found. Please create a user with email: test@test.com');
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})\n`);

    // Get some menu items
    const menuItems = await prisma.menuItem.findMany({
      take: 3
    });

    if (menuItems.length === 0) {
      console.error('❌ No menu items found. Please add some menu items first.');
      return;
    }

    console.log(`✅ Found ${menuItems.length} menu items\n`);

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: `sub_test_${Date.now()}`,
        planName: 'Weekly Meal Plan',
        interval: 'WEEKLY',
        price: 4999, // £49.99 in pence
        status: 'ACTIVE',
        startDate: new Date(),
        nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        subscriptionItems: {
          create: menuItems.map((item, index) => ({
            menuItemId: item.id,
            quantity: index + 1 // 1, 2, 3 quantities
          }))
        }
      },
      include: {
        subscriptionItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    console.log('✅ Test subscription created successfully!\n');
    console.log('📋 Subscription Details:');
    console.log(`   ID: ${subscription.id}`);
    console.log(`   Plan: ${subscription.planName}`);
    console.log(`   Interval: ${subscription.interval}`);
    console.log(`   Price: £${(subscription.price / 100).toFixed(2)}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Next Delivery: ${subscription.nextDeliveryDate.toLocaleDateString()}`);
    console.log('\n📦 Items:');
    subscription.subscriptionItems.forEach(item => {
      console.log(`   - ${item.quantity}x ${item.menuItem.name} (£${(item.menuItem.price / 100).toFixed(2)} each)`);
    });

    console.log('\n✅ Test subscription created! You can now check the subscriptions page.');

  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestSubscription();