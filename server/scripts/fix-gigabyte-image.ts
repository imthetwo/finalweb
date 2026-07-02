import { prisma } from './prisma-client';

async function main() {
  const r = await prisma.product.updateMany({
    where: { name: 'Gigabyte Radeon RX 7900 XT Gaming OC' },
    data: { imageUrl: 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/TechStore/gpu/asrock-rx9070xt-steel-legend' },
  });
  console.log(`Updated ${r.count} product(s)`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
