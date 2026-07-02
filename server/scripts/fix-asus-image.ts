import { prisma } from './prisma-client';

async function main() {
  const result = await prisma.product.updateMany({
    where: { name: 'ASUS ROG Strix RTX 4080 SUPER' },
    data: {
      imageUrl: 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/TechStore/gpu/msi-rtx4060ti-gaming-x',
    },
  });
  console.log(`Updated ${result.count} product(s)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
