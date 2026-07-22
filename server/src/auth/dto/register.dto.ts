import { IsBoolean, IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @Length(6, 100, { message: 'Password must be at least 6 characters' })
  password!: string;

  // Same letters-only rule as UpdateProfileDto and checkout's ShippingInfoDto —
  // otherwise an account could register with a digit-only name like "123" that
  // the profile page would then refuse to keep on any later edit.
  @IsString()
  @Length(2, 60, { message: 'Full name must be between 2 and 60 characters' })
  @Matches(/^[\p{L}][\p{L}\s.'-]*$/u, { message: 'Full name must contain letters only (no numbers)' })
  fullName!: string;

  @IsOptional()
  @IsBoolean()
  subscribeNewsletter?: boolean;
}
