import { IsInt, IsNumber, IsString } from 'class-validator';

// MoMo IPN webhook body — validated as defense-in-depth. The real authenticity
// check is the HMAC-SHA256 signature verification in PaymentsService.handleMomoIpn
// (an attacker without the shared secret cannot forge a request that passes
// that check regardless of what's declared here); this DTO just makes sure
// the fields have the right shape before the service logic touches them.
export class MomoIpnDto {
  @IsString() partnerCode!: string;
  @IsString() orderId!: string;
  @IsString() requestId!: string;
  @IsNumber() amount!: number;
  @IsString() orderInfo!: string;
  @IsString() orderType!: string;
  @IsInt() transId!: number;
  @IsInt() resultCode!: number;
  @IsString() message!: string;
  @IsString() payType!: string;
  @IsNumber() responseTime!: number;
  @IsString() extraData!: string;
  @IsString() signature!: string;
}
