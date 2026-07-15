import { IsString } from 'class-validator';

// Public "track my order" lookup — no account needed. orderId + phone must
// both match, since phone is the one contact field every checkout (guest or
// not) always collects, unlike the optional email.
export class TrackOrderDto {
  @IsString() orderId!: string;
  @IsString() phone!: string;
}
