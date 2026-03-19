const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'juantaguado05@gmail.com' },
    update: {},
    create: {
      email: 'juantaguado05@gmail.com',
      password: hashedPassword,
      documento: '1004628559',
      nombre: 'JUAN',
      apellidos: 'TAGUADO',
      role: 'SUPER_ADMIN',
      active: true,
    },
  });

  console.log({ superAdmin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
