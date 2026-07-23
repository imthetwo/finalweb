import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService, SPEC_INCLUDE } from '../../products/products.service';
import { CreateProductDto, UpdateProductDto } from '../dto/admin-product.dto';
import { assertSalePriceValid } from '../../common/pricing';

@Injectable()
export class AdminProductsCrudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

  async list(params: { search?: string; page?: number; limit?: number; categoryId?: string }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const where: Prisma.ProductWhereInput = {};
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.search) where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { brand: { contains: params.search, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { category: { select: { id: true, name: true } }, ...SPEC_INCLUDE },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map((p) => this.products.formatProduct(p)), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateProductDto, asDraft = false) {
    assertSalePriceValid(dto.price, dto.salePrice);
    const { cpuSpec, gpuSpec, ramSpec, motherboardSpec, psuSpec, caseSpec, coolerSpec, monitorSpec, storageSpec, laptopSpec, pcBuildSpec, furnitureSpec, ...base } = dto;
    return this.prisma.product.create({
      data: {
        ...base,
        ...(asDraft ? { isPublished: false } : {}),
        ...(cpuSpec ? { cpuSpec: { create: cpuSpec } } : {}),
        ...(gpuSpec ? { gpuSpec: { create: gpuSpec } } : {}),
        ...(ramSpec ? { ramSpec: { create: ramSpec } } : {}),
        ...(motherboardSpec ? { motherboardSpec: { create: motherboardSpec } } : {}),
        ...(psuSpec ? { psuSpec: { create: psuSpec } } : {}),
        ...(caseSpec ? { caseSpec: { create: caseSpec } } : {}),
        ...(coolerSpec ? { coolerSpec: { create: coolerSpec } } : {}),
        ...(monitorSpec ? { monitorSpec: { create: monitorSpec } } : {}),
        ...(storageSpec ? { storageSpec: { create: storageSpec } } : {}),
        ...(laptopSpec ? { laptopSpec: { create: laptopSpec } } : {}),
        ...(pcBuildSpec ? { pcBuildSpec: { create: pcBuildSpec } } : {}),
        ...(furnitureSpec ? { furnitureSpec: { create: furnitureSpec } } : {}),
      },
      include: { category: { select: { id: true, name: true } }, ...SPEC_INCLUDE },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await this.assertExists(id);
    // A partial update might only send one of price/salePrice — fall back to
    // the current DB value for whichever one is missing so the cross-check
    // still catches e.g. "lower price below an already-set salePrice".
    if (dto.price !== undefined || dto.salePrice !== undefined) {
      const nextPrice = dto.price ?? existing.price;
      const nextSalePrice = dto.salePrice !== undefined ? dto.salePrice : existing.salePrice;
      assertSalePriceValid(nextPrice, nextSalePrice);
    }
    const { cpuSpec, gpuSpec, ramSpec, motherboardSpec, psuSpec, caseSpec, coolerSpec, monitorSpec, storageSpec, laptopSpec, pcBuildSpec, furnitureSpec, ...base } = dto;

    // A request that touches ANY spec field defines the product's complete
    // spec set for this update — any of the 12 spec types omitted from it
    // gets cleared if the product currently has one, so switching a
    // product's category (e.g. CPU → GPU) can't leave a stale, now-
    // irrelevant spec row attached forever.
    const touchesSpecs = [cpuSpec, gpuSpec, ramSpec, motherboardSpec, psuSpec, caseSpec, coolerSpec, monitorSpec, storageSpec, laptopSpec, pcBuildSpec, furnitureSpec].some((v) => v !== undefined);
    const hasSpec = touchesSpecs ? await this.prisma.product.findUnique({
      where: { id },
      select: {
        cpuSpec: { select: { productId: true } }, gpuSpec: { select: { productId: true } },
        ramSpec: { select: { productId: true } }, motherboardSpec: { select: { productId: true } },
        psuSpec: { select: { productId: true } }, caseSpec: { select: { productId: true } },
        coolerSpec: { select: { productId: true } }, monitorSpec: { select: { productId: true } },
        storageSpec: { select: { productId: true } }, laptopSpec: { select: { productId: true } },
        pcBuildSpec: { select: { productId: true } }, furnitureSpec: { select: { productId: true } },
      },
    }) : null;

    const data: Prisma.ProductUpdateInput = { ...(base as Prisma.ProductUncheckedUpdateInput) };
    if (cpuSpec) data.cpuSpec = { upsert: { create: cpuSpec, update: cpuSpec } };
    else if (touchesSpecs && hasSpec?.cpuSpec) data.cpuSpec = { delete: true };
    if (gpuSpec) data.gpuSpec = { upsert: { create: gpuSpec, update: gpuSpec } };
    else if (touchesSpecs && hasSpec?.gpuSpec) data.gpuSpec = { delete: true };
    if (ramSpec) data.ramSpec = { upsert: { create: ramSpec, update: ramSpec } };
    else if (touchesSpecs && hasSpec?.ramSpec) data.ramSpec = { delete: true };
    if (motherboardSpec) data.motherboardSpec = { upsert: { create: motherboardSpec, update: motherboardSpec } };
    else if (touchesSpecs && hasSpec?.motherboardSpec) data.motherboardSpec = { delete: true };
    if (psuSpec) data.psuSpec = { upsert: { create: psuSpec, update: psuSpec } };
    else if (touchesSpecs && hasSpec?.psuSpec) data.psuSpec = { delete: true };
    if (caseSpec) data.caseSpec = { upsert: { create: caseSpec, update: caseSpec } };
    else if (touchesSpecs && hasSpec?.caseSpec) data.caseSpec = { delete: true };
    if (coolerSpec) data.coolerSpec = { upsert: { create: coolerSpec, update: coolerSpec } };
    else if (touchesSpecs && hasSpec?.coolerSpec) data.coolerSpec = { delete: true };
    if (monitorSpec) data.monitorSpec = { upsert: { create: monitorSpec, update: monitorSpec } };
    else if (touchesSpecs && hasSpec?.monitorSpec) data.monitorSpec = { delete: true };
    if (storageSpec) data.storageSpec = { upsert: { create: storageSpec, update: storageSpec } };
    else if (touchesSpecs && hasSpec?.storageSpec) data.storageSpec = { delete: true };
    if (laptopSpec) data.laptopSpec = { upsert: { create: laptopSpec, update: laptopSpec } };
    else if (touchesSpecs && hasSpec?.laptopSpec) data.laptopSpec = { delete: true };
    if (pcBuildSpec) data.pcBuildSpec = { upsert: { create: pcBuildSpec, update: pcBuildSpec } };
    else if (touchesSpecs && hasSpec?.pcBuildSpec) data.pcBuildSpec = { delete: true };
    if (furnitureSpec) data.furnitureSpec = { upsert: { create: furnitureSpec, update: furnitureSpec } };
    else if (touchesSpecs && hasSpec?.furnitureSpec) data.furnitureSpec = { delete: true };

    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } }, ...SPEC_INCLUDE },
    });
  }

  async approve(id: string) {
    await this.assertExists(id);
    return this.prisma.product.update({ where: { id }, data: { isPublished: true } });
  }

  async remove(id: string) {
    await this.assertExists(id);
    // OrderItem has no onDelete: Cascade on purpose — a product that's ever
    // been ordered is permanent financial/record-keeping history and must
    // never disappear from a past order, even a delivered or cancelled one.
    // (CartItem *does* cascade — a cart isn't historical, so it's fine for a
    // deleted product to just quietly drop out of it.) Without this check,
    // the delete would instead fail as a raw, unhandled 500 (Postgres FK
    // violation / Prisma P2003).
    const everOrdered = await this.prisma.orderItem.findFirst({ where: { productId: id } });
    if (everOrdered) {
      throw new BadRequestException(
        'This product appears in past orders and cannot be deleted — unpublish it instead to hide it from the shop.',
      );
    }
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  private async assertExists(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }
}
