import { toast } from "sonner";

import { mergeGuestCart } from "@/lib/api/cart";
import { claimGuestOrders } from "@/lib/api/orders";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";

export async function syncGuestDataToAccount(token: string): Promise<void> {
  try {
    const { claimed } = await claimGuestOrders(token);
    if (claimed > 0) {
      toast.message(
        claimed === 1
          ? "1 previous order placed with this email was added to your order history."
          : `${claimed} previous orders placed with this email were added to your order history.`,
      );
    }
  } catch {
    // Non-fatal — the user can still sign in; past guest orders just won't
    // appear this time (e.g. transient network issue).
  }

  const guestItems = getGuestCart();
  if (guestItems.length > 0) {
    try {
      const { skipped } = await mergeGuestCart(guestItems, token);
      clearGuestCart();
      window.dispatchEvent(new Event("cart-updated"));
      if (skipped > 0) {
        toast.message(
          skipped === 1
            ? "1 item from your guest cart is no longer available and was skipped."
            : `${skipped} items from your guest cart are no longer available and were skipped.`,
        );
      }
    } catch {
      toast.error("Could not restore your guest cart items — please check your cart.");
    }
  }
}
