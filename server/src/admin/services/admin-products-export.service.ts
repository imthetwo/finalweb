import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { SPEC_INCLUDE } from '../../products/products.service';

// Reporting for admins: the full catalog broken out by spec type, and a
// simple stock overview — both read-only exports, no writes.
@Injectable()
export class AdminProductsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportExcel(): Promise<ExcelJS.Buffer> {
    const all = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: { category: { select: { name: true } }, ...SPEC_INCLUDE },
    });
    const wb = new ExcelJS.Workbook();

    const base = (p: (typeof all)[0]) => ({
      name: p.name, brand: p.brand, category: p.category?.name ?? '',
      costPrice: p.costPrice ?? '', price: p.price, salePrice: p.salePrice ?? '',
      margin: p.costPrice ? `${Math.round((1 - p.costPrice / p.price) * 100)}%` : '',
      stock: p.stock, description: p.description ?? '', imageUrl: p.imageUrl ?? '',
      published: p.isPublished ? 'Yes' : 'No',
    });

    const sheet = (name: string, cols: Partial<ExcelJS.Column>[], rows: Record<string, unknown>[]) => {
      const ws = wb.addWorksheet(name);
      ws.columns = cols;
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow(r));
    };

    // Header text matches what AdminProductsImportService's parser normalizes
    // to (strip spaces/asterisks, lowercase) — so exporting the catalog and
    // re-importing it round-trips every field instead of silently nulling
    // whatever this sheet's headers don't spell exactly like the parser.
    const baseCols = (extra: Partial<ExcelJS.Column>[]) => [
      { header: 'Name', key: 'name', width: 32 }, { header: 'Brand', key: 'brand', width: 16 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'CostPrice', key: 'costPrice', width: 14 },
      { header: 'Price', key: 'price', width: 14 }, { header: 'SalePrice', key: 'salePrice', width: 14 },
      { header: 'Margin', key: 'margin', width: 10 },
      { header: 'Stock', key: 'stock', width: 8 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'ImageUrl', key: 'imageUrl', width: 40 },
      { header: 'Published', key: 'published', width: 10 }, ...extra,
    ] as ExcelJS.Column[];

    sheet('CPU', baseCols([
      { header: 'Socket', key: 'socket', width: 12 }, { header: 'Cores', key: 'cores', width: 8 },
      { header: 'Threads', key: 'threads', width: 8 }, { header: 'Base GHz', key: 'baseClockGhz', width: 10 },
      { header: 'Boost GHz', key: 'boostClockGhz', width: 10 }, { header: 'TDP (W)', key: 'tdp', width: 8 },
    ]), all.filter((p) => p.cpuSpec).map((p) => ({ ...base(p), ...p.cpuSpec! })));

    sheet('GPU', baseCols([
      { header: 'VRAM (GB)', key: 'vramGb', width: 10 }, { header: 'TDP (W)', key: 'tdp', width: 8 },
      { header: 'Mem Type', key: 'memType', width: 12 }, { header: 'PCIe Gen', key: 'pcieGen', width: 10 },
    ]), all.filter((p) => p.gpuSpec).map((p) => ({ ...base(p), ...p.gpuSpec! })));

    sheet('RAM', baseCols([
      { header: 'Capacity (GB)', key: 'capacityGb', width: 14 }, { header: 'Speed (MHz)', key: 'speedMhz', width: 12 },
      { header: 'Generation', key: 'generation', width: 10 }, { header: 'Latency', key: 'latency', width: 10 },
    ]), all.filter((p) => p.ramSpec).map((p) => ({ ...base(p), ...p.ramSpec! })));

    sheet('Motherboard', baseCols([
      { header: 'Socket', key: 'socket', width: 12 }, { header: 'Chipset', key: 'chipset', width: 12 },
      { header: 'Form Factor', key: 'formFactor', width: 12 }, { header: 'RAM Gen', key: 'ramGen', width: 10 },
    ]), all.filter((p) => p.motherboardSpec).map((p) => ({ ...base(p), ...p.motherboardSpec! })));

    sheet('PSU', baseCols([
      { header: 'Wattage', key: 'wattage', width: 12 }, { header: 'Efficiency', key: 'efficiency', width: 16 },
      { header: 'Modular', key: 'modular', width: 12 },
    ]), all.filter((p) => p.psuSpec).map((p) => ({ ...base(p), ...p.psuSpec! })));

    sheet('Case', baseCols([
      { header: 'Form Factor', key: 'formFactor', width: 12 }, { header: 'Max GPU (mm)', key: 'maxGpuLengthMm', width: 14 },
    ]), all.filter((p) => p.caseSpec).map((p) => ({ ...base(p), ...p.caseSpec! })));

    sheet('Cooler', baseCols([
      { header: 'Type', key: 'coolerType', width: 10 }, { header: 'TDP Rating (W)', key: 'tdpRating', width: 14 },
      { header: 'Radiator (mm)', key: 'radiatorSizeMm', width: 14 },
    ]), all.filter((p) => p.coolerSpec).map((p) => ({ ...base(p), ...p.coolerSpec! })));

    sheet('Monitor', baseCols([
      { header: 'Size (in)', key: 'sizeIn', width: 10 }, { header: 'Resolution', key: 'resolution', width: 14 },
      { header: 'Refresh Hz', key: 'refreshRateHz', width: 12 }, { header: 'Panel', key: 'panelType', width: 10 },
    ]), all.filter((p) => p.monitorSpec).map((p) => ({ ...base(p), ...p.monitorSpec! })));

    sheet('Storage', baseCols([
      { header: 'Capacity (GB)', key: 'capacityGb', width: 14 }, { header: 'Type', key: 'storageType', width: 10 },
      { header: 'Interface', key: 'interfaceType', width: 14 }, { header: 'Read MB/s', key: 'readMbps', width: 12 },
    ]), all.filter((p) => p.storageSpec).map((p) => ({ ...base(p), ...p.storageSpec! })));

    sheet('Laptop', baseCols([
      { header: 'CPU', key: 'cpu', width: 28 }, { header: 'GPU', key: 'gpu', width: 20 },
      { header: 'RAM (GB)', key: 'ramGb', width: 10 }, { header: 'Storage (GB)', key: 'storageGb', width: 12 },
    ]), all.filter((p) => p.laptopSpec).map((p) => ({ ...base(p), ...p.laptopSpec! })));

    sheet('Prebuilt PC', baseCols([
      { header: 'Build Type', key: 'buildType', width: 18 },
    ]), all.filter((p) => p.pcBuildSpec).map((p) => ({ ...base(p), ...p.pcBuildSpec! })));

    sheet('Furniture', baseCols([
      { header: 'Furniture Type', key: 'furnitureType', width: 18 },
    ]), all.filter((p) => p.furnitureSpec).map((p) => ({ ...base(p), ...p.furnitureSpec! })));

    sheet('Other', baseCols([]),
      all.filter((p) => !p.cpuSpec && !p.gpuSpec && !p.ramSpec && !p.motherboardSpec && !p.psuSpec &&
        !p.caseSpec && !p.coolerSpec && !p.monitorSpec && !p.storageSpec && !p.laptopSpec && !p.pcBuildSpec && !p.furnitureSpec).map(base));

    return wb.xlsx.writeBuffer();
  }

  // Inventory Report — simple stock overview with low-stock highlighting
  async exportInventoryReport(): Promise<ExcelJS.Buffer> {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, price: true, stock: true },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inventory Report');
    const thin: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' },
    };

    // Column widths — 4 columns: No. | Product Name | Price | Stock
    ws.columns = [
      { key: 'no', width: 8 }, { key: 'name', width: 48 },
      { key: 'price', width: 18 }, { key: 'stock', width: 12 },
    ] as ExcelJS.Column[];

    // Row 1 — merged title cell "INVENTORY REPORT" + export date
    ws.mergeCells('A1:D1');
    const title = ws.getCell('A1');
    const today = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy — matches app convention
    title.value = `INVENTORY REPORT  —  ${today}`;
    title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A2E' } };
    ws.getRow(1).height = 28;

    // Row 2 — bold, bordered column headers
    const head = ws.getRow(2);
    head.values = ['No.', 'Product Name', 'Price (VND)', 'Stock'];
    head.font = { bold: true };
    head.alignment = { horizontal: 'center', vertical: 'middle' };
    head.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
      cell.border = thin;
    });

    const LOW_STOCK = 10;
    products.forEach((p, i) => {
      const row = ws.addRow([i + 1, p.name, p.price, p.stock]);
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(3).numFmt = '#,##0';
      row.getCell(4).alignment = { horizontal: 'center' };
      row.eachCell((cell) => { cell.border = thin; });

      // Conditional formatting — low stock rows highlighted red/orange
      if (p.stock < LOW_STOCK) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
          cell.font = { color: { argb: 'FF9C0006' }, bold: true };
        });
      }
    });

    return wb.xlsx.writeBuffer();
  }
}
