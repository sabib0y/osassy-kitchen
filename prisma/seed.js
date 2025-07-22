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
