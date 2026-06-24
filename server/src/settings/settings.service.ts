import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string): Promise<string | null> {
    const s = await this.prisma.siteSetting.findUnique({ where: { key } });
    return s?.value ?? null;
  }

  async set(key: string, value: string): Promise<{ key: string; value: string }> {
    return this.prisma.siteSetting.upsert({
      where:  { key },
      create: { key, value },
      update: { value },
    });
  }

  async getAll(): Promise<Record<string, string>> {
    const all = await this.prisma.siteSetting.findMany();
    return Object.fromEntries(all.map((s) => [s.key, s.value]));
  }
}
