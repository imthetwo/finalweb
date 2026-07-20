import { IsString } from 'class-validator';

export class ConfirmSubscriptionDto {
  @IsString()
  token!: string;
}
