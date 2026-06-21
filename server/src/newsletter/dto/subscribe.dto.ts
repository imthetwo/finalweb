import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscribeDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source?: string;
}
