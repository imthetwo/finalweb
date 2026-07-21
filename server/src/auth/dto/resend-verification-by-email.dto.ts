import { IsEmail } from 'class-validator';

export class ResendVerificationByEmailDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;
}
