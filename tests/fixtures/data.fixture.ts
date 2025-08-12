/**
 * Test Data Fixtures
 * Provides consistent test data for E2E tests
 */

import { faker } from '@faker-js/faker';

/**
 * Test user data
 */
export const testUsers = {
  newUser: {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: 'Test123!@#',
    phone: faker.phone.number('###-###-####'),
  },
  existingUser: {
    email: 'testuser@example.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
  },
  adminUser: {
    email: 'admin@osassyskitchen.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
  },
};

/**
 * Test subscription data
 */
export const testSubscriptions = {
  weekly: {
    planId: 'weekly',
    name: 'Weekly Plan',
    price: 49.99,
    interval: 'week',
    features: [
      '7 meals per week',
      'Free delivery',
      'Customizable menu',
      'Cancel anytime',
    ],
  },
  monthly: {
    planId: 'monthly',
    name: 'Monthly Plan',
    price: 179.99,
    interval: 'month',
    features: [
      '30 meals per month',
      'Free delivery',
      'Priority support',
      'Exclusive dishes',
      'Cancel anytime',
    ],
  },
};

/**
 * Test address data
 */
export const testAddresses = {
  primary: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    country: 'US',
    isDefault: true,
  },
  secondary: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    country: 'US',
    isDefault: false,
  },
};

/**
 * Test payment methods
 */
export const testPaymentMethods = {
  validCard: {
    number: '4242424242424242',
    exp_month: '12',
    exp_year: String(new Date().getFullYear() + 2),
    cvc: '123',
    name: faker.person.fullName(),
    zipCode: faker.location.zipCode(),
  },
  validCard2: {
    number: '5555555555554444',
    exp_month: '06',
    exp_year: String(new Date().getFullYear() + 3),
    cvc: '456',
    name: faker.person.fullName(),
    zipCode: faker.location.zipCode(),
  },
  invalidCard: {
    number: '4000000000000002',
    exp_month: '12',
    exp_year: String(new Date().getFullYear() + 1),
    cvc: '123',
    name: faker.person.fullName(),
    zipCode: faker.location.zipCode(),
  },
};

/**
 * Test menu items
 */
export const testMenuItems = {
  item1: {
    name: 'Jollof Rice with Chicken',
    description: 'Traditional West African rice dish with tender chicken',
    price: 15.99,
    category: 'Main Dishes',
    image: '/images/jollof-rice.jpg',
    available: true,
    spiceLevel: 2,
    isVegetarian: false,
    isGlutenFree: true,
    calories: 650,
    prepTime: 45,
  },
  item2: {
    name: 'Egusi Soup',
    description: 'Rich melon seed soup with vegetables and meat',
    price: 18.99,
    category: 'Soups',
    image: '/images/egusi-soup.jpg',
    available: true,
    spiceLevel: 3,
    isVegetarian: false,
    isGlutenFree: true,
    calories: 520,
    prepTime: 60,
  },
  item3: {
    name: 'Plantain Fufu',
    description: 'Traditional African staple made from plantains',
    price: 8.99,
    category: 'Sides',
    image: '/images/plantain-fufu.jpg',
    available: true,
    spiceLevel: 0,
    isVegetarian: true,
    isGlutenFree: true,
    calories: 280,
    prepTime: 30,
  },
};

/**
 * Test order data
 */
export const testOrders = {
  pendingOrder: {
    items: [
      { menuItemId: '1', quantity: 2, price: 15.99 },
      { menuItemId: '2', quantity: 1, price: 18.99 },
    ],
    status: 'pending',
    total: 50.97,
    deliveryAddress: testAddresses.primary,
    deliveryTime: '2024-01-15T18:00:00Z',
  },
  completedOrder: {
    items: [
      { menuItemId: '3', quantity: 3, price: 8.99 },
    ],
    status: 'completed',
    total: 26.97,
    deliveryAddress: testAddresses.secondary,
    deliveryTime: '2024-01-10T19:00:00Z',
  },
};

/**
 * Test notification preferences
 */
export const testNotificationPreferences = {
  all: {
    email: true,
    sms: true,
    push: true,
    orderUpdates: true,
    promotions: true,
    weeklyMenu: true,
  },
  minimal: {
    email: true,
    sms: false,
    push: false,
    orderUpdates: true,
    promotions: false,
    weeklyMenu: false,
  },
  none: {
    email: false,
    sms: false,
    push: false,
    orderUpdates: false,
    promotions: false,
    weeklyMenu: false,
  },
};

/**
 * Generate random test data
 */
export function generateRandomUser() {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 12, memorable: false, pattern: /[A-Za-z0-9!@#]/ }),
    phone: faker.phone.number('###-###-####'),
  };
}

export function generateRandomAddress() {
  return {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipCode: faker.location.zipCode(),
    country: 'US',
  };
}

export function generateRandomMenuItem() {
  const categories = ['Main Dishes', 'Soups', 'Sides', 'Appetizers', 'Desserts'];
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 5, max: 30 })),
    category: faker.helpers.arrayElement(categories),
    available: faker.datatype.boolean(),
    spiceLevel: faker.number.int({ min: 0, max: 5 }),
    isVegetarian: faker.datatype.boolean(),
    isGlutenFree: faker.datatype.boolean(),
    calories: faker.number.int({ min: 100, max: 1000 }),
    prepTime: faker.number.int({ min: 15, max: 90 }),
  };
}

/**
 * Stripe test card numbers
 */
export const stripeTestCards = {
  success: '4242424242424242',
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expired: '4000000000000069',
  incorrectCvc: '4000000000000127',
  processingError: '4000000000000119',
  threeDSecure: '4000002500003155',
  threeDSecure2: '4000002760003184',
};

/**
 * Wait times for various operations
 */
export const waitTimes = {
  short: 1000,
  medium: 3000,
  long: 5000,
  veryLong: 10000,
};