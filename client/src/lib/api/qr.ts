import type { OrderQr } from "@/types/api";
import { fetchWithTimeout, getApiUrl } from "./client";

// GET /qr/order/:id — public, no auth required (unguessable UUID). Uses a
// plain fetch (not apiFetch) since a missing/expired order should resolve
// to null quietly rather than throwing.
export async function fetchOrderQr(orderId: string): Promise<OrderQr | null> {
  try {
    const res = await fetchWithTimeout(getApiUrl(`/qr/order/${orderId}`));
    return res.ok ? (res.json() as Promise<OrderQr>) : null;
  } catch {
    return null;
  }
}
