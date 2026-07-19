import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchProducts, type ProductListItem } from "@/lib/api";

// Data/logic for the header search — debounced product lookup, results dropdown
// state, and navigation to a product or the full results page. The component
// only renders the input and the result list.
export function useSearch(onClose: () => void) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const t = setTimeout(() => {
      fetchProducts({ search: q, limit: 6 })
        .then((d) => setResults(d.items))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function goToResults() {
    const q = query.trim();
    if (!q) return;
    router.push(`/shop?search=${encodeURIComponent(q)}`);
    onClose();
  }

  function goToProduct(id: string) {
    router.push(`/product/${id}`);
    onClose();
  }

  return { inputRef, query, setQuery, results, loading, open, goToResults, goToProduct };
}
