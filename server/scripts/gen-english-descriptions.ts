import { prisma } from './prisma-client';
import * as fs from 'fs';
import * as path from 'path';

type Spec = Record<string, unknown> & { type?: string };

function generate(name: string, brand: string, category: string, spec: Spec | null): string {
  const t = spec?.type;

  if (t === 'cpuSpec') {
    const { socket, cores, threads, baseClockGhz, boostClockGhz, tdp, cacheL3 } = spec as any;
    const parts = [`${name} desktop processor by ${brand}`];
    if (cores && threads) parts.push(`${cores} cores / ${threads} threads`);
    if (baseClockGhz && boostClockGhz) parts.push(`${baseClockGhz} GHz base — up to ${boostClockGhz} GHz boost`);
    if (cacheL3) parts.push(`${cacheL3} L3 cache`);
    if (socket) parts.push(`${socket} socket`);
    if (tdp) parts.push(`${tdp}W TDP`);
    return parts.join(', ') + '.';
  }

  if (t === 'gpuSpec') {
    const { vramGb, tdp, lengthMm, boostClockMhz, memType, pcieGen } = spec as any;
    const parts = [`${name} graphics card by ${brand}`];
    if (vramGb) parts.push(`${vramGb}GB ${memType ?? 'GDDR6'} VRAM`);
    if (boostClockMhz) parts.push(`${boostClockMhz} MHz boost clock`);
    if (pcieGen) parts.push(`PCIe ${pcieGen}`);
    if (lengthMm) parts.push(`${lengthMm} mm card length`);
    if (tdp) parts.push(`${tdp}W TDP`);
    return parts.join(', ') + '.';
  }

  if (t === 'motherboardSpec') {
    const { socket, chipset, formFactor, ramGen, ramSlots, maxRamGb } = spec as any;
    const parts = [`${name} motherboard by ${brand}`];
    if (socket && chipset) parts.push(`${socket} socket with ${chipset} chipset`);
    if (formFactor) parts.push(`${formFactor} form factor`);
    if (ramGen && ramSlots) parts.push(`${ramSlots}× ${ramGen} slots`);
    if (maxRamGb) parts.push(`supports up to ${maxRamGb} GB RAM`);
    return parts.join(', ') + '.';
  }

  if (t === 'ramSpec') {
    const { capacityGb, speedMhz, generation, latency, kit } = spec as any;
    const parts = [`${name} memory kit by ${brand}`];
    if (capacityGb) parts.push(`${capacityGb} GB${kit ? ` (${kit})` : ''}`);
    if (generation) parts.push(generation);
    if (speedMhz) parts.push(`${speedMhz} MHz`);
    if (latency) parts.push(`CL${latency}`);
    return parts.join(', ') + '.';
  }

  if (t === 'storageSpec') {
    const { capacityGb, storageType, interfaceType, readMbps, writeMbps } = spec as any;
    const cap = capacityGb >= 1000 ? `${capacityGb / 1000} TB` : `${capacityGb} GB`;
    const parts = [`${name} ${storageType ?? 'SSD'} by ${brand}`, cap];
    if (interfaceType) parts.push(`${interfaceType} interface`);
    if (readMbps) parts.push(`up to ${readMbps} MB/s sequential read`);
    if (writeMbps) parts.push(`${writeMbps} MB/s sequential write`);
    return parts.join(', ') + '.';
  }

  if (t === 'psuSpec') {
    const { wattage, efficiency, modular } = spec as any;
    const parts = [`${name} power supply unit by ${brand}`];
    if (wattage) parts.push(`${wattage}W output`);
    if (efficiency) parts.push(`${efficiency} efficiency rating`);
    if (modular !== undefined) parts.push(modular ? 'fully modular cabling' : 'non-modular cabling');
    return parts.join(', ') + '.';
  }

  if (t === 'caseSpec') {
    const { formFactor, maxGpuLengthMm, radiatorSupport, driveBays } = spec as any;
    const parts = [`${name} PC case by ${brand}`];
    if (formFactor) parts.push(`${formFactor} motherboard support`);
    if (maxGpuLengthMm) parts.push(`GPU clearance up to ${maxGpuLengthMm} mm`);
    if (radiatorSupport) parts.push(`${radiatorSupport} mm radiator support`);
    if (driveBays) parts.push(`${driveBays} drive bays`);
    return parts.join(', ') + '.';
  }

  if (t === 'coolerSpec') {
    const { coolerType, tdpRating, radiatorSizeMm, socketSupport } = spec as any;
    const parts = [`${name} CPU cooler by ${brand}`];
    if (coolerType) parts.push(coolerType === 'AIO' ? 'all-in-one liquid cooler' : `${coolerType} air cooler`);
    if (radiatorSizeMm) parts.push(`${radiatorSizeMm} mm radiator`);
    if (tdpRating) parts.push(`rated up to ${tdpRating}W TDP`);
    if (socketSupport) parts.push(`compatible with ${socketSupport}`);
    return parts.join(', ') + '.';
  }

  if (t === 'monitorSpec') {
    const { sizeIn, resolution, refreshRateHz, panelType, responseMs, hdr } = spec as any;
    const parts = [`${name} gaming monitor by ${brand}`];
    if (sizeIn) parts.push(`${sizeIn}" display`);
    if (resolution) parts.push(resolution);
    if (refreshRateHz) parts.push(`${refreshRateHz} Hz refresh rate`);
    if (panelType) parts.push(`${panelType} panel`);
    if (responseMs) parts.push(`${responseMs} ms response time`);
    if (hdr) parts.push('HDR support');
    return parts.join(', ') + '.';
  }

  if (t === 'laptopSpec') {
    const { cpu, gpu, ramGb, storageGb, displaySizeIn, displayResolution, os } = spec as any;
    const parts = [`${name} gaming laptop by ${brand}`];
    if (cpu) parts.push(`${cpu} processor`);
    if (gpu) parts.push(`${gpu} graphics`);
    if (ramGb) parts.push(`${ramGb} GB DDR5 RAM`);
    if (storageGb) {
      const cap = storageGb >= 1000 ? `${storageGb / 1000} TB` : `${storageGb} GB`;
      parts.push(`${cap} NVMe SSD`);
    }
    if (displaySizeIn && displayResolution) parts.push(`${displaySizeIn}" ${displayResolution} display`);
    if (os) parts.push(`${os}`);
    return parts.join(', ') + '.';
  }

  // Fallback: keyboards, mice, fans, headsets, furniture, prebuilt PCs
  return `${name} by ${brand}. Premium ${category} product engineered for gamers and enthusiasts.`;
}

async function main() {
  const jsonPath = path.join(__dirname, '../data/products.json');
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const key = Object.keys(raw).find((k) => Array.isArray(raw[k]))!;
  const arr: any[] = raw[key];

  let jsonUpdated = 0;
  const updates: Array<{ name: string; description: string }> = [];

  for (const p of arr) {
    const desc = generate(p.name, p.brand ?? '', p.category ?? '', p.spec ?? null);
    p.description = desc;
    updates.push({ name: p.name, description: desc });
    jsonUpdated++;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(raw, null, 2));
  console.log(`✅ Updated ${jsonUpdated} descriptions in products.json`);

  // Sync to DB
  let dbUpdated = 0;
  for (const u of updates) {
    const r = await prisma.product.updateMany({
      where: { name: u.name },
      data: { description: u.description },
    });
    dbUpdated += r.count;
  }
  console.log(`✅ Synced ${dbUpdated} product descriptions to DB`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
