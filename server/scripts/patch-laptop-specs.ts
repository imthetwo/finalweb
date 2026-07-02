import { prisma } from './prisma-client';
import * as fs from 'fs';
import * as path from 'path';

const PATCHES = [
  {
    name: 'Acer Nitro 17 RTX 4060 AN17-42',
    description:
      'Acer Nitro 17 RTX 4060 AN17-42 gaming laptop by Acer, AMD Ryzen 7 8745H processor, RTX 4060 8GB graphics, 16 GB DDR5 RAM, 512 GB NVMe SSD, 17.3" 1920×1080 165Hz display, Windows 11.',
    spec: {
      type: 'laptopSpec',
      cpu: 'AMD Ryzen 7 8745H',
      gpu: 'RTX 4060',
      ramGb: 16,
      storageGb: 512,
      displaySizeIn: 17.3,
      displayResolution: '1920x1080',
      os: 'Windows 11',
    },
  },
  {
    name: 'ASUS TUF Gaming F15 2024',
    description:
      'ASUS TUF Gaming F15 2024 gaming laptop by ASUS. Military-grade durability meets gaming performance in a 15.6" chassis with dedicated NVIDIA RTX graphics and high-refresh display.',
  },
  {
    name: 'Acer Predator Helios Neo 16 MacanS RTX 4070',
    description:
      'Acer Predator Helios Neo 16 MacanS RTX 4070 gaming laptop by Acer. Powered by RTX 4070 graphics in a 16" form factor — built for high-fidelity gaming and demanding creative workloads.',
  },
  {
    name: 'Acer Predator Triton 14 OLED RTX 4060',
    description:
      'Acer Predator Triton 14 OLED RTX 4060 gaming laptop by Acer. RTX 4060 graphics paired with a brilliant 14" OLED display in a thin, portable design for gamers on the go.',
  },
];

async function main() {
  // Update products.json spec + description
  const jsonPath = path.join(__dirname, '../data/products.json');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const key = Object.keys(raw).find((k) => Array.isArray(raw[k]))!;
  const arr: any[] = raw[key];

  for (const patch of PATCHES) {
    const product = arr.find((p) => p.name === patch.name);
    if (product) {
      product.description = patch.description;
      if ((patch as any).spec) product.spec = (patch as any).spec;
    }
  }
  fs.writeFileSync(jsonPath, JSON.stringify(raw, null, 2));
  console.log('✅ Updated products.json');

  // Sync descriptions to DB
  for (const patch of PATCHES) {
    const r = await prisma.product.updateMany({
      where: { name: patch.name },
      data: { description: patch.description },
    });
    console.log(`${r.count > 0 ? '✅' : '⚠️'} ${patch.name} → ${r.count} row(s)`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
