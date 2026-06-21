import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export class CreateAddressDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsString()
  recipient!: string;

  @IsString()
  phone!: string;

  @IsString()
  street!: string;

  @IsOptional()
  @IsString()
  ward?: string;

  @IsString()
  district!: string;

  @IsString()
  city!: string;

  @IsOptional()
  isDefault?: boolean;
}
