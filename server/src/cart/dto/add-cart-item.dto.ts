import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;
}
