import type { ProductListItem } from "@/types/api";

export type CartItem = {
  id: string;
  quantity: number;
  lineTotal: number;
  customBuildId: string | null;
  product: {
    id: string;
    name: string;
    thumbnailUrl: string | null;
    displayPrice: number;
    stock: number;
    category?: { id: string; name: string } | null;
  };
};

export type Cart = { items: CartItem[]; subTotal: number };

export type GuestDisplayItem = { productId: string; quantity: number; product: ProductListItem };
