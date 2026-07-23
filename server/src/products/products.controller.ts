import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductsService } from './products.service';

class ListProductsQueryDto {
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() buildType?: string;
  @IsOptional() @IsString() storageType?: string;
  @IsOptional() @IsString() coolerType?: string;
  @IsOptional() @IsString() furnitureType?: string;
  @IsOptional() @IsIn(['featured', 'price-asc', 'price-desc', 'name']) sortBy?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  list(@Query() query: ListProductsQueryDto) {
    return this.productsService.findAll({
      ...query,
      page: query.page ?? 1,
      limit: query.limit ?? 24,
    });
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  getOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }
}
