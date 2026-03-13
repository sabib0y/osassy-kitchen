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
    // Rice dishes (none are vegetarian as they come with protein, none are spicy)
    { name: 'White Rice', description: 'Comes with stew and choice of protein', price: 12.99, category: 'Rice', isVegetarian: false, isSpicy: false },
    { name: 'Plain Jollof Rice', description: 'Garnished with mixed vegetables', price: 14.99, category: 'Rice', isVegetarian: false, isSpicy: false },
    { name: 'Fried Rice', description: 'With mixed vegetables and protein', price: 15.99, category: 'Rice', isVegetarian: false, isSpicy: false },

    // Stews (both are spicy, neither is vegetarian due to meat content)
    { name: 'Spicy Palm Oil Stew', description: 'Traditional palm oil stew', price: 8.99, category: 'Stew', isVegetarian: false, isSpicy: true },
    { name: 'Ayamashe Stew', description: 'Ofada stew with assorted meat', price: 10.99, category: 'Stew', isVegetarian: false, isSpicy: true },

    // Soups (none are vegetarian due to stock fish/meat, none are particularly spicy)
    { name: 'Fresh Okro Soup', description: 'Traditional okro soup', price: 13.99, category: 'Soup', isVegetarian: false, isSpicy: false },
    { name: 'Edikaikong Soup', description: 'Vegetable soup with stock fish', price: 14.99, category: 'Soup', isVegetarian: false, isSpicy: false },
    { name: 'Egusi Soup', description: 'Melon seed soup', price: 13.99, category: 'Soup', isVegetarian: false, isSpicy: false },

    // Specials (Isi-Ewu is spicy, neither is vegetarian)
    { name: 'Gizzard and Dodo', description: 'Garnished in red sauce', price: 16.99, category: 'Special', isVegetarian: false, isSpicy: false },
    { name: 'Isi-Ewu', description: 'Goat head delicacy', price: 18.99, category: 'Special', isVegetarian: false, isSpicy: true },
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
