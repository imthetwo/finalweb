import { BadRequestException } from '@nestjs/common';

// Single source of truth for "what does this product actually cost right now" —
// a salePrice only counts as a real discount when it's lower than price. Every
// place that charges/displays money must go through this, not a bare
// `salePrice ?? price`, or a stale/misconfigured salePrice >= price silently
// overcharges the customer relative to what the storefront showed them.
export function effectivePrice(product: { price: number; salePrice: number | null }): number {
  return product.salePrice != null && product.salePrice < product.price
    ? product.salePrice
    : product.price;
}

// Called wherever price/salePrice can be written (create, update, Excel
// import) so a bad salePrice can never reach the DB in the first place.
export function assertSalePriceValid(price: number, salePrice: number | null | undefined): void {
  if (salePrice != null && salePrice >= price) {
    throw new BadRequestException('Sale price must be lower than the regular price');
  }
}
