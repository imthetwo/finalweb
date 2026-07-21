import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { effectivePrice } from '../common/pricing';

export type ChatTurn = { role: 'user' | 'model'; text: string };

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

const MAX_PER_CATEGORY = 8;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Compact spec summary so the model can verify compatibility (socket, RAM gen,
  // wattage, GPU length…) instead of guessing from product names.
  private specOf(p: {
    cpuSpec?: { socket: string; cores: number; tdp: number } | null;
    gpuSpec?: { vramGb: number; tdp: number; lengthMm: number | null } | null;
    ramSpec?: { generation: string; capacityGb: number; speedMhz: number } | null;
    motherboardSpec?: { socket: string; ramGen: string; formFactor: string } | null;
    psuSpec?: { wattage: number } | null;
    caseSpec?: { formFactor: string; maxGpuLengthMm: number | null } | null;
    coolerSpec?: { socketSupport: string | null; tdpRating: number | null } | null;
    storageSpec?: { capacityGb: number; storageType: string } | null;
    monitorSpec?: { sizeIn: number; refreshRateHz: number; resolution: string } | null;
    laptopSpec?: { cpu: string; gpu: string | null; ramGb: number } | null;
  }): string {
    const bits: (string | null | undefined | false)[] = [];
    if (p.cpuSpec) bits.push(`socket ${p.cpuSpec.socket}`, `${p.cpuSpec.cores} cores`, `${p.cpuSpec.tdp}W`);
    if (p.gpuSpec) bits.push(`${p.gpuSpec.vramGb}GB VRAM`, `${p.gpuSpec.tdp}W`, p.gpuSpec.lengthMm ? `${p.gpuSpec.lengthMm}mm long` : null);
    if (p.ramSpec) bits.push(p.ramSpec.generation, `${p.ramSpec.capacityGb}GB`, `${p.ramSpec.speedMhz}MHz`);
    if (p.motherboardSpec) bits.push(`socket ${p.motherboardSpec.socket}`, p.motherboardSpec.ramGen, p.motherboardSpec.formFactor);
    if (p.psuSpec) bits.push(`${p.psuSpec.wattage}W`);
    if (p.caseSpec) bits.push(p.caseSpec.formFactor, p.caseSpec.maxGpuLengthMm ? `fits GPU ≤${p.caseSpec.maxGpuLengthMm}mm` : null);
    if (p.coolerSpec) bits.push(p.coolerSpec.socketSupport, p.coolerSpec.tdpRating ? `up to ${p.coolerSpec.tdpRating}W` : null);
    if (p.storageSpec) bits.push(`${p.storageSpec.capacityGb}GB ${p.storageSpec.storageType}`);
    if (p.monitorSpec) bits.push(`${p.monitorSpec.sizeIn}"`, `${p.monitorSpec.refreshRateHz}Hz`, p.monitorSpec.resolution);
    if (p.laptopSpec) bits.push(p.laptopSpec.cpu, p.laptopSpec.gpu, `${p.laptopSpec.ramGb}GB RAM`);
    const s = bits.filter(Boolean).join(', ');
    return s ? ` [${s}]` : '';
  }

  // Even price spread: cheapest → most expensive, so the model sees valid options
  // for low AND high budgets (not just the 8 cheapest).
  private spread<T>(arr: T[], n: number): T[] {
    if (arr.length <= n) return arr;
    const out: T[] = [];
    for (let i = 0; i < n; i++) out.push(arr[Math.round((i * (arr.length - 1)) / (n - 1))]);
    return out;
  }

  private async buildInventory(): Promise<{ text: string; count: number }> {
    const products = await this.prisma.product.findMany({
      where: { isPublished: true, stock: { gt: 0 } },
      include: {
        category: { select: { name: true } },
        cpuSpec: { select: { socket: true, cores: true, tdp: true } },
        gpuSpec: { select: { vramGb: true, tdp: true, lengthMm: true } },
        ramSpec: { select: { generation: true, capacityGb: true, speedMhz: true } },
        motherboardSpec: { select: { socket: true, ramGen: true, formFactor: true } },
        psuSpec: { select: { wattage: true } },
        caseSpec: { select: { formFactor: true, maxGpuLengthMm: true } },
        coolerSpec: { select: { socketSupport: true, tdpRating: true } },
        storageSpec: { select: { capacityGb: true, storageType: true } },
        monitorSpec: { select: { sizeIn: true, refreshRateHz: true, resolution: true } },
        laptopSpec: { select: { cpu: true, gpu: true, ramGb: true } },
      },
      orderBy: [{ categoryId: 'asc' }, { price: 'asc' }],
    });

    const byCat = new Map<string, typeof products>();
    for (const p of products) {
      const catName = p.category?.name ?? 'Other';
      byCat.set(catName, [...(byCat.get(catName) ?? []), p]);
    }

    const fmt = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });
    const lines: string[] = [];
    let count = 0;

    for (const [catName, items] of byCat) {
      lines.push(`\n### ${catName}`);
      for (const p of this.spread(items, MAX_PER_CATEGORY)) {
        count++;
        const price = effectivePrice(p);
        lines.push(
          `- ${p.name} (${p.brand}) — ${fmt.format(price)}${this.specOf(p)} — ${p.stock} in stock — link: /product/${p.id}`,
        );
      }
    }

    return { text: lines.join('\n'), count };
  }

  async chat(message: string, history: ChatTurn[] = []) {
    const inventory = await this.buildInventory();

    const systemPrompt = `You are the PC-build consultant for the Pecify store. All prices are Vietnamese đồng (₫). Customers may write budgets as "15.000.000₫", "15M", "15tr" or "15 triệu" — all mean 15,000,000 ₫.

TASK: recommend concrete products from the INVENTORY that fit the customer's budget and use-case, each with a clickable link so they can buy immediately.

RESPONSE STYLE — short and shoppable:
1. Identify the budget in ₫ and the use-case (gaming title, work, rendering, streaming…).
2. For "build/PC" requests recommend 1–3 ready products from **Prebuilt PCs** (or **Laptops** if asked); for a specific part request, recommend from that category.
3. Format every recommendation on its own line as:
   **[Exact product name](/product/{id})** — price — one short sentence on why it fits.
   Use the exact "link:" path from the inventory. ALWAYS include the link.
4. Keep the whole reply under ~120 words. NO long component-by-component build lists unless the customer EXPLICITLY asks to build from separate parts.
5. Budget honesty: prefer options within budget. If nothing fits, say so plainly and show the closest (cheapest) option with its link and price.
6. Only if the customer explicitly asks for a custom part-by-part build: pick compatible parts (CPU socket = motherboard socket, RAM gen = motherboard RAM gen, PSU wattage ≥ TDP + 40%, GPU length ≤ case limit), link every part, and show an exact TOTAL.

STRICT RULES:
- ONLY use products from the inventory below, with their EXACT names, prices and links. Never invent products, prices or links.
- Reply in ENGLISH, professional and friendly.
- If the customer asks something unrelated to PCs, politely steer back to consulting.

CURRENT INVENTORY (${inventory.count} products):
${inventory.text || '(Inventory is empty — tell the customer to check back later.)'}`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY missing — using offline fallback.');
      return { reply: this.fallbackReply(message, inventory), source: 'fallback' as const };
    }

    try {
      const contents = [
        ...history.slice(-8).map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        { role: 'user', parts: [{ text: message }] },
      ];

      const res = await fetch(GEMINI_URL(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
            // Gemini 2.5 counts hidden "thinking" tokens against maxOutputTokens —
            // give it a bounded budget for compatibility reasoning, with enough
            // output tokens left so replies never truncate mid-sentence.
            thinkingConfig: { thinkingBudget: 1024 },
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
        return { reply: this.fallbackReply(message, inventory), source: 'fallback' as const };
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      const reply =
        data.candidates?.[0]?.content?.parts
          ?.filter((p) => !p.thought)
          .map((p) => p.text)
          .join('') ?? '';

      if (!reply.trim()) {
        return { reply: this.fallbackReply(message, inventory), source: 'fallback' as const };
      }
      return { reply, source: 'gemini' as const };
    } catch (err) {
      this.logger.error(`Gemini call failed: ${(err as Error).message}`);
      return { reply: this.fallbackReply(message, inventory), source: 'fallback' as const };
    }
  }

  private fallbackReply(message: string, inventory: { text: string; count: number }) {
    if (inventory.count === 0) {
      return "Sorry, we're temporarily out of stock. Please check back later!";
    }
    return [
      `Thanks for your interest! For "${message.trim()}", we currently have ${inventory.count} products in stock.`,
      '',
      'Here are some products available right now:',
      inventory.text.split('\n').slice(0, 14).join('\n'),
    ].join('\n');
  }
}
