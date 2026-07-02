import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  source?: string;
}
