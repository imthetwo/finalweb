import { IsString, Length } from 'class-validator';

// Public "track my order" lookup — no account needed. orderId + phone must
// both match, since phone is the one contact field every checkout (guest or
// not) always collects, unlike the optional email.
//
// NOTE: orderId is intentionally NOT @IsUUID() — trackGuestOrder() matches it
// as a prefix against the full UUID (see that method's comment for why: the
// UI/email only ever show the first 8 hex chars). Minimum length 6 keeps the
// prefix specific enough that it can't match an unrelated order by accident.
export class TrackOrderDto {
  @IsString() @Length(6, 100, { message: 'Please enter your order ID' }) orderId!: string;
  @IsString() @Length(1, 20, { message: 'Please enter a valid phone number' }) phone!: string;
}
