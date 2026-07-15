import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

// All fields optional (PATCH-style partial update) — same validation rules as
// CreateAddressDto/ShippingInfoDto, just non-required.
export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  label?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  @Matches(/^[\p{L}][\p{L}\s.'-]*$/u, { message: 'recipient must be a valid full name (letters only)' })
  recipient?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0\d{9}|\+84\d{9})$/, { message: 'phone must be a valid Vietnamese phone number, e.g. 0901234567' })
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(3, 120)
  @Matches(/\p{L}/u, { message: 'street must include a street name' })
  street?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  @Matches(/\p{L}/u, { message: 'ward must include a name, e.g. "Phường Sài Gòn"' })
  ward?: string;

  @IsOptional()
  @IsString()
  @Length(2, 60)
  @Matches(/\p{L}/u, { message: 'city must be a valid name' })
  city?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
