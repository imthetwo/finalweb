import { Type } from 'class-transformer';
import {
  IsArray, IsEmail, IsIn, IsInt,
  IsString, Min, ValidateNested,
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

  // Required — the only recovery channel a guest has if they lose their order
  // ID (no account to log into, no saved order list). See OrdersService's
  // sendOrderConfirmation call, which is what actually delivers it.
  @IsEmail()
  guestEmail!: string;
}
