const { PrismaClient } = require('@prisma/client');
async function main() {
  const p = new PrismaClient();
  const u = await p.user.update({
    where: { email: 'juantaguado05@gmail.com' },
    data: { role: 'SUPER_ADMIN' }
  });
  console.log('ROL ACTUALIZADO A:', u.role);
  await p.$disconnect();
}
main();
