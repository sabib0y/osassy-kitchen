const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@test.com' },
    select: { id: true, email: true, name: true, password: true }
  });

  if (user === null) {
    console.log('User not found!');
    return;
  }

  console.log('User found:', user.email);
  console.log('Has password:', user.password !== null);

  if (user.password) {
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log('Password "password123" valid:', isValid);

    if (isValid === false) {
      // Reset password to password123
      const newHash = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { email: 'test@test.com' },
        data: { password: newHash }
      });
      console.log('Password reset to "password123"');
    }
  } else {
    // Set password
    const newHash = await bcrypt.hash('password123', 10);
    await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { password: newHash }
    });
    console.log('Password set to "password123"');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
