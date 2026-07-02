import { IsBoolean, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  orderId!: string;

  @IsBoolean()
  success!: boolean;
}
