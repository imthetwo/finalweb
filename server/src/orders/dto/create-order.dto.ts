import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ShippingInfoDto } from './shipping-info.dto';

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => ShippingInfoDto)
  shippingInfo!: ShippingInfoDto;

  @IsIn(['COD', 'MOMO'])
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  // Frontend-driven opt-in: user checked "Save this address to my address book"
  // for a freshly-typed shipping address. Ignored when absent/false.
  @IsBoolean()
  @IsOptional()
  saveAddress?: boolean;
}
