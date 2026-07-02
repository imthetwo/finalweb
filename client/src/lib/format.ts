const VND_TO_USD = 25000;

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount / VND_TO_USD);
}
