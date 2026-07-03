import { Type } from 'class-transformer';
import {
  IsArray, IsEmail, IsInt, IsObject,
  IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';

export class GuestCartItemDto {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
}

export class GuestCheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items!: GuestCartItemDto[];

  @IsObject()
  shippingInfo!: Record<string, string>;

  @IsString()
  paymentMethod!: string;

  @IsString() @IsOptional()
  couponCode?: string;

  @IsEmail() @IsOptional()
  guestEmail?: string;
}
