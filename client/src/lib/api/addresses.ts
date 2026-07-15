import type { Address, AddressInput } from "@/types/api";
import { apiFetch } from "./client";

export const fetchAddresses = () =>
  apiFetch<Address[]>("/addresses");

export const createAddress = (data: AddressInput) =>
  apiFetch<Address>("/addresses", { method: "POST", body: JSON.stringify(data) });

export const updateAddress = (id: string, data: Partial<AddressInput>) =>
  apiFetch<Address>(`/addresses/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const deleteAddress = (id: string) =>
  apiFetch<{ ok: boolean }>(`/addresses/${id}`, { method: "DELETE" });
