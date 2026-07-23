import { IsOptional, IsString, Length, Matches, MinLength, ValidateIf } from 'class-validator';

// Email is deliberately NOT here — it's fixed at registration and proven via
// the mandatory verification link (see AuthService). Letting it be changed
// here without resetting isEmailVerified would mean the account could show
// "Verified" next to an email that was never actually confirmed.
export class UpdateProfileDto {
  // Same rule as checkout's ShippingInfoDto.recipient — letters only, rejects
  // digit-only junk like "123".
  @IsOptional()
  @IsString()
  @Length(3, 60, { message: 'Full name must be between 3 and 60 characters' })
  @Matches(/^[\p{L}][\p{L}\s.'-]*$/u, { message: 'Full name must contain letters only (no numbers)' })
  fullName?: string;

  // Same Vietnamese phone format enforced everywhere else in the app — but an
  // empty string is allowed through (skips the regex) so the profile form can
  // still clear an existing phone number back to "not set".
  @IsOptional()
  @IsString()
  @ValidateIf((o: UpdateProfileDto) => !!o.phone)
  @Matches(/^(0\d{9}|\+84\d{9})$/, { message: 'Phone must be a valid Vietnamese phone number, e.g. 0901234567' })
  phone?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  newPassword!: string;
}
