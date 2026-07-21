import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  quantity?: number;

  // Client-generated, shared across every part added together from Custom
  // Lab's "add all to cart" — lets the cart page group them as one build
  // (see useCartView.ts's groupByBuild) instead of showing loose, unrelated
  // line items. Not a foreign key to anything; just an opaque grouping tag.
  @IsOptional()
  @IsString()
  customBuildId?: string;
}
