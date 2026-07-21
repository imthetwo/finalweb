import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ShippingInfoDto } from '../orders/dto/shipping-info.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    const count = await this.prisma.address.count({ where: { userId } });
    // The very first address is always the default, regardless of what was sent.
    const isDefault = count === 0 || !!dto.isDefault;

    // Clearing the old default(s) and creating the new one must commit
    // together — otherwise two concurrent "set as default" requests could
    // each clear before either has inserted its own row, leaving two rows
    // marked isDefault at once.
    if (isDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        return tx.address.create({ data: { ...dto, userId, isDefault } });
      });
    }
    return this.prisma.address.create({ data: { ...dto, userId, isDefault } });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    await this.findOwned(userId, id);

    if (dto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        return tx.address.update({ where: { id }, data: dto });
      });
    }
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const address = await this.findOwned(userId, id);
    await this.prisma.address.delete({ where: { id } });

    // If the default address was just deleted, promote the most recent
    // remaining one so the user always has exactly one default (if any exist).
    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) await this.prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    return { ok: true };
  }

  // Called from checkout when the user ticks "Save this address to my address
  // book". Skips silently if an identical address is already saved, so
  // re-ordering with the same details never creates duplicates.
  async saveFromCheckout(userId: string, info: ShippingInfoDto) {
    const existing = await this.prisma.address.findMany({ where: { userId } });
    const norm = (s: string) => s.trim().toLowerCase();
    const isDuplicate = existing.some(
      (a) =>
        norm(a.recipient) === norm(info.recipient) &&
        norm(a.phone) === norm(info.phone) &&
        norm(a.street) === norm(info.street) &&
        norm(a.ward) === norm(info.ward) &&
        norm(a.city) === norm(info.city),
    );
    if (isDuplicate) return null;
    return this.create(userId, info);
  }

  private async findOwned(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }
}
