import { Type } from 'class-transformer';
import {
  IsArray, IsEmail, IsIn, IsInt,
  IsOptional, IsString, Min, ValidateNested,
} from 'class-validator';
import { ShippingInfoDto } from './shipping-info.dto';

export class GuestCartItemDto {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
}

export class GuestCheckoutDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items!: GuestCartItemDto[];

  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo!: ShippingInfoDto;

  @IsIn(['COD', 'MOMO'])
  paymentMethod!: string;

  @IsEmail() @IsOptional()
  guestEmail?: string;
}
