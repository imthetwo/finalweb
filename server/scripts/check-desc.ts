import { prisma } from './prisma-client';
async function main() {
  const r = await prisma.product.findMany({
    where: { name: { contains: 'Nitro 17' } },
    select: { name: true, description: true },
  });
  r.forEach(x => console.log(x.name, '|', x.description));
}
main().finally(() => prisma.$disconnect());
