"use client";

import { useCallback, useEffect, useState } from "react";
import type { Paginated } from "@/lib/api";

type FetchFn<T> = (search: string, page: number) => Promise<Paginated<T>>;

export function useCRUDManager<T>(fetchFn: FetchFn<T>) {
  const [data,    setData]    = useState<Paginated<T> | null>(null);
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  // reloadKey triggers re-fetch without changing search/page
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFn(search, page)
      .then((d)  => { if (active) setData(d); })
      .catch(()  => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, page, reloadKey, fetchFn]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  return { data, search, page, loading, reload, setPage, handleSearch };
}
