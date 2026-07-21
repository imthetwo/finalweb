import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchProducts, type ProductListItem } from "@/lib/api";
import { SEARCHABLE_PAGES, type SearchablePage } from "../constants";

// A keyword phrase matches on either a whole-phrase prefix ("pc build" ->
// "pc builder") or any single word within it starting with the query
// ("order" -> "track order") — same "word-prefix" feel as the product-name
// matching on the backend.
function matchesPage(page: SearchablePage, q: string): boolean {
  return page.keywords.some(
    (phrase) => phrase.startsWith(q) || phrase.split(" ").some((word) => word.startsWith(q)),
  );
}

// Data/logic for the header search — debounced product lookup, results dropdown
// state, and navigation to a product, a site page, or the full results page.
// The component only renders the input and the result list.
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

  const q = query.trim().toLowerCase();

  const pageResults = useMemo(
    () => (q.length < 2 ? [] : SEARCHABLE_PAGES.filter((p) => matchesPage(p, q))),
    [q],
  );

  useEffect(() => {
    if (q.length < 3) {
      setResults([]);
      setOpen(pageResults.length > 0);
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
  }, [q, pageResults.length]);

  function goToResults() {
    if (!q) return;
    router.push(`/shop?search=${encodeURIComponent(q)}`);
    onClose();
  }

  function goToProduct(id: string) {
    router.push(`/product/${id}`);
    onClose();
  }

  function goToPage(href: string) {
    router.push(href);
    onClose();
  }

  return { inputRef, query, setQuery, results, pageResults, loading, open, goToResults, goToProduct, goToPage };
}
