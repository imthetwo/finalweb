import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Spec sub-DTOs ─────────────────────────────────────────────────────────────

export class CpuSpecDto {
  @IsString() socket!: string;
  @IsInt() cores!: number;
  @IsInt() threads!: number;
  @IsNumber() baseClockGhz!: number;
  @IsNumber() boostClockGhz!: number;
  @IsInt() tdp!: number;
  @IsOptional() @IsString() cacheL3?: string;
  @IsOptional() @IsString() generation?: string;
}

export class GpuSpecDto {
  @IsInt() vramGb!: number;
  @IsInt() tdp!: number;
  @IsOptional() @IsInt() lengthMm?: number;
  @IsOptional() @IsInt() pcieGen?: number;
  @IsOptional() @IsInt() boostClockMhz?: number;
  @IsOptional() @IsString() memType?: string;
}

export class RamSpecDto {
  @IsInt() capacityGb!: number;
  @IsInt() speedMhz!: number;
  @IsString() generation!: string;
  @IsOptional() @IsString() latency?: string;
  @IsOptional() @IsString() kit?: string;
}

export class MotherboardSpecDto {
  @IsString() socket!: string;
  @IsOptional() @IsString() chipset?: string;
  @IsString() formFactor!: string;
  @IsString() ramGen!: string;
  @IsInt() ramSlots!: number;
  @IsOptional() @IsInt() maxRamGb?: number;
}

export class PsuSpecDto {
  @IsInt() wattage!: number;
  @IsOptional() @IsString() efficiency?: string;
  @IsOptional() @IsString() modular?: string;
}

export class CaseSpecDto {
  @IsString() formFactor!: string;
  @IsOptional() @IsInt() maxGpuLengthMm?: number;
  @IsOptional() @IsString() radiatorSupport?: string;
  @IsOptional() @IsInt() driveBays?: number;
}

export class CoolerSpecDto {
  @IsString() coolerType!: string;
  @IsOptional() @IsInt() tdpRating?: number;
  @IsOptional() @IsInt() radiatorSizeMm?: number;
  @IsOptional() @IsString() socketSupport?: string;
}

export class MonitorSpecDto {
  @IsNumber() sizeIn!: number;
  @IsString() resolution!: string;
  @IsInt() refreshRateHz!: number;
  @IsOptional() @IsString() panelType?: string;
  @IsOptional() @IsNumber() responseMs?: number;
  @IsOptional() @IsBoolean() hdr?: boolean;
}

export class StorageSpecDto {
  @IsInt() capacityGb!: number;
  @IsString() storageType!: string;
  @IsOptional() @IsString() interfaceType?: string;
  @IsOptional() @IsInt() readMbps?: number;
  @IsOptional() @IsInt() writeMbps?: number;
}

export class LaptopSpecDto {
  @IsString() cpu!: string;
  @IsOptional() @IsString() gpu?: string;
  @IsInt() ramGb!: number;
  @IsInt() storageGb!: number;
  @IsNumber() displaySizeIn!: number;
  @IsOptional() @IsString() displayResolution?: string;
  @IsOptional() @IsString() os?: string;
}

// ── Product DTOs ──────────────────────────────────────────────────────────────

export class CreateProductDto {
  @IsString() categoryId!: string;
  @IsString() name!: string;
  @IsString() brand!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;

  @IsOptional() @ValidateNested() @Type(() => CpuSpecDto) cpuSpec?: CpuSpecDto;
  @IsOptional() @ValidateNested() @Type(() => GpuSpecDto) gpuSpec?: GpuSpecDto;
  @IsOptional() @ValidateNested() @Type(() => RamSpecDto) ramSpec?: RamSpecDto;
  @IsOptional() @ValidateNested() @Type(() => MotherboardSpecDto) motherboardSpec?: MotherboardSpecDto;
  @IsOptional() @ValidateNested() @Type(() => PsuSpecDto) psuSpec?: PsuSpecDto;
  @IsOptional() @ValidateNested() @Type(() => CaseSpecDto) caseSpec?: CaseSpecDto;
  @IsOptional() @ValidateNested() @Type(() => CoolerSpecDto) coolerSpec?: CoolerSpecDto;
  @IsOptional() @ValidateNested() @Type(() => MonitorSpecDto) monitorSpec?: MonitorSpecDto;
  @IsOptional() @ValidateNested() @Type(() => StorageSpecDto) storageSpec?: StorageSpecDto;
  @IsOptional() @ValidateNested() @Type(() => LaptopSpecDto) laptopSpec?: LaptopSpecDto;
}

export class UpdateProductDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) salePrice?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;

  @IsOptional() @ValidateNested() @Type(() => CpuSpecDto) cpuSpec?: CpuSpecDto;
  @IsOptional() @ValidateNested() @Type(() => GpuSpecDto) gpuSpec?: GpuSpecDto;
  @IsOptional() @ValidateNested() @Type(() => RamSpecDto) ramSpec?: RamSpecDto;
  @IsOptional() @ValidateNested() @Type(() => MotherboardSpecDto) motherboardSpec?: MotherboardSpecDto;
  @IsOptional() @ValidateNested() @Type(() => PsuSpecDto) psuSpec?: PsuSpecDto;
  @IsOptional() @ValidateNested() @Type(() => CaseSpecDto) caseSpec?: CaseSpecDto;
  @IsOptional() @ValidateNested() @Type(() => CoolerSpecDto) coolerSpec?: CoolerSpecDto;
  @IsOptional() @ValidateNested() @Type(() => MonitorSpecDto) monitorSpec?: MonitorSpecDto;
  @IsOptional() @ValidateNested() @Type(() => StorageSpecDto) storageSpec?: StorageSpecDto;
  @IsOptional() @ValidateNested() @Type(() => LaptopSpecDto) laptopSpec?: LaptopSpecDto;
}

export class UpdateOrderStatusDto {
  @IsString() status!: string;
}

export class CreatePromotionDto {
  @IsString() title!: string;
  @IsOptional() @IsString() actionLabel?: string;
  @IsOptional() @IsString() href?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdatePromotionDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() actionLabel?: string;
  @IsOptional() @IsString() href?: string;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}
