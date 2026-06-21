import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ChatTurn = { role: 'user' | 'model'; text: string };

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

const MAX_PER_CATEGORY = 8;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async buildInventory(): Promise<{ text: string; count: number }> {
    const products = await this.prisma.product.findMany({
      where: { isPublished: true, stock: { gt: 0 } },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ categoryId: 'asc' }, { price: 'asc' }],
      take: MAX_PER_CATEGORY * 10,
    });

    const byCat = new Map<string, typeof products>();
    for (const p of products) {
      const catName = p.category?.name ?? 'Other';
      const arr = byCat.get(catName) ?? [];
      if (arr.length < MAX_PER_CATEGORY) {
        arr.push(p);
        byCat.set(catName, arr);
      }
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
      for (const p of items) {
        count++;
        const price = p.salePrice ?? p.price;
        lines.push(`- ${p.name} (${p.brand}) — ${fmt.format(price)} — ${p.stock} in stock`);
      }
    }

    return { text: lines.join('\n'), count };
  }

  async chat(message: string, history: ChatTurn[] = []) {
    const inventory = await this.buildInventory();

    const systemPrompt = `You are the PC-build consultant for the Pecify store.
TASK: use the INVENTORY LIST below to recommend products that fit the customer's needs and budget.

STRICT RULES:
- ONLY recommend products that exist in the inventory list. Never invent products.
- Try to stay within the customer's budget. If it's over or under, say so clearly.
- Reply in ENGLISH, professional and friendly, well-structured (list each product + price).
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
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
        return { reply: this.fallbackReply(message, inventory), source: 'fallback' as const };
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';

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
