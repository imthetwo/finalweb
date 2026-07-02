import { prisma } from './prisma-client';

const FIXES = [
  {
    name: 'ASUS ROG Strix RTX 4080 SUPER',
    imageUrl: 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/TechStore/gpu/asus-rx9070xt-prime',
  },
  {
    name: 'Gigabyte Radeon RX 7900 XT Gaming OC',
    imageUrl: 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/TechStore/gpu/gigabyte-rtx3060-gaming-oc-8g',
  },
  {
    name: 'MSI GeForce RTX 4060 Ti Gaming X',
    imageUrl: 'https://res.cloudinary.com/dxbvnueoq/image/upload/f_auto,q_auto,w_600/TechStore/gpu/4070_TWIN_X2_GDDR6_set',
  },
];

async function main() {
  for (const fix of FIXES) {
    const r = await prisma.product.updateMany({ where: { name: fix.name }, data: { imageUrl: fix.imageUrl } });
    console.log(`${r.count > 0 ? '✅' : '⚠️ '} ${fix.name} → updated ${r.count}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
