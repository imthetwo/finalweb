import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'Please enter your full name' })
  fullName!: string;

  @IsOptional()
  @IsBoolean()
  subscribeNewsletter?: boolean;
}
