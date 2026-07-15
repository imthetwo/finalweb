import { IsString, Length, Matches } from 'class-validator';

// Field-level validation for the shipping block — rejects digit-only junk like
// name "123" or street "123123", and enforces a valid Vietnamese phone number.
export class ShippingInfoDto {
  // Letters (incl. Vietnamese), spaces and basic punctuation only
  @IsString()
  @Length(2, 60)
  @Matches(/^[\p{L}][\p{L}\s.'-]*$/u, { message: 'recipient must be a valid full name (letters only)' })
  recipient!: string;

  // Vietnamese mobile/landline: 0XXXXXXXXX (10 digits) or +84XXXXXXXXX
  @IsString()
  @Matches(/^(0\d{9}|\+84\d{9})$/, { message: 'phone must be a valid Vietnamese phone number, e.g. 0901234567' })
  phone!: string;

  // Must contain at least one letter — "123123" alone is not an address
  @IsString()
  @Length(3, 120)
  @Matches(/\p{L}/u, { message: 'street must include a street name' })
  street!: string;

  // Ward (phường/xã) — Vietnam's two-tier structure since July 2025 has no districts
  @IsString()
  @Length(2, 60)
  @Matches(/\p{L}/u, { message: 'ward must include a name, e.g. "Phường Sài Gòn"' })
  ward!: string;

  @IsString()
  @Length(2, 60)
  @Matches(/\p{L}/u, { message: 'city must be a valid name' })
  city!: string;
}
