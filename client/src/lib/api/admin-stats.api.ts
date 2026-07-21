import type { AdminStats } from "@/types/api";
import { apiFetch } from "./client";

export const fetchAdminStats = () =>
  apiFetch<AdminStats>("/admin/stats");
