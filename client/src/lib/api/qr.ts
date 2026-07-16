import type { OrderQr } from "@/types/api";
import { getApiUrl } from "./client";

// GET /qr/order/:id — public, no auth required (unguessable UUID). Uses a
// plain fetch (not apiFetch) since a missing/expired order should resolve
// to null quietly rather than throwing.
export async function fetchOrderQr(orderId: string): Promise<OrderQr | null> {
  const res = await fetch(getApiUrl(`/qr/order/${orderId}`));
  return res.ok ? (res.json() as Promise<OrderQr>) : null;
}
