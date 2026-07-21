import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';

// Staff data-entry: parsing the Excel catalog import and generating the
// blank template they fill in — both revolve around the same fixed column
// layout (name/brand/categoryname/price/...), kept together for that reason.
@Injectable()
export class AdminProductsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importExcel(buffer: Buffer, asDraft = false) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Empty workbook');

    const header: Record<string, number> = {};
    ws.getRow(1).eachCell((cell, col) => { header[String(cell.value).trim().toLowerCase()] = col; });

    // Accept "category" as an alias for "categoryname" so either header works.
    if (!header['categoryname'] && header['category']) header['categoryname'] = header['category'];

    // Only name, category and price are truly required — brand is optional (defaults below).
    for (const h of ['name', 'categoryname', 'price']) {
      if (!header[h]) {
        const label = h === 'categoryname' ? 'category' : h;
        throw new BadRequestException(`Missing required column: ${label}`);
      }
    }

    const categories = await this.prisma.category.findMany({ select: { id: true, name: true } });
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const get = (k: string) => (header[k] ? row.getCell(header[k]).value : undefined);

      // Skip fully-empty rows silently; report rows that have data but no name.
      const scanned = ['name', 'brand', 'categoryname', 'price', 'stock', 'description'].map((k) => get(k));
      const isEmptyRow = scanned.every((v) => v == null || String(v).trim() === '');
      if (isEmptyRow) { result.skipped++; continue; }

      const name = get('name')?.toString().trim();
      if (!name) { result.errors.push(`Row ${r}: missing product name`); continue; }

      const categoryName = get('categoryname')?.toString().trim() ?? '';
      const categoryId = catByName.get(categoryName.toLowerCase());
      if (!categoryId) { result.errors.push(`Row ${r}: category "${categoryName}" does not exist`); continue; }

      const price = Number(get('price'));
      if (!Number.isFinite(price) || price <= 0) { result.errors.push(`Row ${r}: invalid or negative price`); continue; }

      // costPrice/salePrice/stock are optional cells — only validate when the
      // row actually provides one, but reject negative/non-numeric values
      // rather than silently storing them (Number("-5") is truthy, so a bare
      // `get(...) ? Number(...) : default` check would let negatives through).
      const rawCostPrice = get('costprice');
      const costPrice = rawCostPrice != null && String(rawCostPrice).trim() !== '' ? Number(rawCostPrice) : null;
      if (costPrice != null && (!Number.isFinite(costPrice) || costPrice < 0)) {
        result.errors.push(`Row ${r}: invalid or negative cost price`); continue;
      }

      const rawSalePrice = get('saleprice');
      const salePrice = rawSalePrice != null && String(rawSalePrice).trim() !== '' ? Number(rawSalePrice) : null;
      if (salePrice != null && (!Number.isFinite(salePrice) || salePrice < 0)) {
        result.errors.push(`Row ${r}: invalid or negative sale price`); continue;
      }
      if (salePrice != null && salePrice >= price) {
        result.errors.push(`Row ${r}: sale price must be lower than price`); continue;
      }

      const rawStock = get('stock');
      const stock = rawStock != null && String(rawStock).trim() !== '' ? Number(rawStock) : 10;
      if (!Number.isFinite(stock) || stock < 0) {
        result.errors.push(`Row ${r}: invalid or negative stock`); continue;
      }

      try {
        const existing = await this.prisma.product.findFirst({ where: { name, categoryId } });

        // Staff import → a brand-new row always starts as a draft, even if the
        // Excel row says Published=Yes. But a staff correction to a row that
        // already exists must NOT silently pull an already-live product off
        // the shop — it keeps its current publish state instead. Admin import
        // always just respects the Published column either way.
        const isPublished = !asDraft
          ? get('published')?.toString().toLowerCase() !== 'no'
          : (existing?.isPublished ?? false);

        const data = {
          categoryId, name,
          brand: get('brand')?.toString().trim() || 'Pecify',
          price,
          costPrice,
          salePrice,
          stock,
          description: get('description')?.toString().trim() || null,
          imageUrl: get('imageurl')?.toString().trim() || null,
          isPublished,
        };

        if (existing) { await this.prisma.product.update({ where: { id: existing.id }, data }); result.updated++; }
        else { await this.prisma.product.create({ data }); result.created++; }
      } catch (e) { result.errors.push(`Row ${r}: ${(e as Error).message}`); }
    }
    return result;
  }

  // Excel template for staff data entry
  async exportProductTemplate(): Promise<ExcelJS.Buffer> {
    const categories = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    const wb = new ExcelJS.Workbook();

    // Sheet 1: Data-entry template
    const ws = wb.addWorksheet('Import Template');
    ws.columns = [
      { header: 'Name *',         key: 'name',         width: 35 },
      { header: 'Brand *',        key: 'brand',        width: 15 },
      { header: 'CategoryName *', key: 'categoryname', width: 22 },
      { header: 'CostPrice',      key: 'costprice',    width: 14 },
      { header: 'Price *',        key: 'price',        width: 14 },
      { header: 'SalePrice',      key: 'saleprice',    width: 14 },
      { header: 'Stock',          key: 'stock',        width: 8  },
      { header: 'Description',    key: 'description',  width: 50 },
      { header: 'ImageUrl',       key: 'imageurl',     width: 40 },
      { header: 'Published',      key: 'published',    width: 10 },
    ] as ExcelJS.Column[];

    const hRow = ws.getRow(1);
    hRow.font = { bold: true };
    hRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
    hRow.getCell(1).font = { bold: true, color: { argb: 'FF00FFFF' } };

    // 2 example rows
    ws.addRow({ name: 'Intel Core i9-14900K', brand: 'Intel', categoryname: 'Processors (CPU)', costprice: 12000000, price: 16000000, saleprice: 15000000, stock: 10, description: '14th-gen Intel CPU, 24 cores...', imageurl: '', published: 'Yes' });
    ws.addRow({ name: 'ASUS ROG RTX 4080', brand: 'ASUS', categoryname: 'Graphics Cards (GPU)', costprice: 24000000, price: 29000000, saleprice: '', stock: 5, description: 'GPU RTX 4080 SUPER 16GB...', imageurl: '', published: 'Yes' });
    ws.getRow(2).font = { italic: true, color: { argb: 'FF888888' } };
    ws.getRow(3).font = { italic: true, color: { argb: 'FF888888' } };

    // Sheet 2: List of valid categories
    const catSheet = wb.addWorksheet('Valid Categories');
    catSheet.columns = [{ header: 'Category Name (use exact spelling)', key: 'name', width: 35 }] as ExcelJS.Column[];
    catSheet.getRow(1).font = { bold: true };
    categories.forEach((c) => catSheet.addRow({ name: c.name }));

    return wb.xlsx.writeBuffer() as Promise<ExcelJS.Buffer>;
  }
}
