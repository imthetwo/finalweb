import Decimal from 'decimal.js';

// Single place responsible for every money SUM in the app — cart subtotal,
// order subtotal/total — instead of cart.service.ts / orders.service.ts each
// hand-rolling their own `reduce()` / `+` chain. Decimal avoids the classic
// 0.1 + 0.2 floating-point drift when many amounts get summed; VND has no
// minor unit so it rarely bites in practice, but a shared, tested place for
// it is one fewer thing every caller has to get right on their own.
// Product.price/salePrice and Order.totalAmount are still plain `Float`
// columns in the DB (schema.prisma) — every method here still returns a
// plain `number` at the boundary, since that's what Prisma actually
// writes/compares against. What counts as the *unit* price in the first
// place is still effectivePrice() in pricing.ts — a separate concern from
// summing amounts, so it isn't duplicated here.
export class PricingService {
  sum(amounts: number[]): number {
    return amounts.reduce((sum, n) => sum.plus(n), new Decimal(0)).toNumber();
  }

  totalAmount(subTotal: number, shippingFee: number, discount = 0): number {
    return new Decimal(subTotal).plus(shippingFee).minus(discount).toNumber();
  }
}

export const pricingService = new PricingService();
