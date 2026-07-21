import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @IsString()
  @IsOptional()
  source?: string;
}
