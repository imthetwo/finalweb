import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { ShippingInfoDto } from '../../orders/dto/shipping-info.dto';

// Same field validation as checkout's shipping info (recipient/phone/street/
// ward/city) plus an optional label and default flag — an address book entry
// is exactly "a shipping address you can reuse".
export class CreateAddressDto extends ShippingInfoDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
