import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// const { data, loading, error, reload, setData } = useApi("/api/products")
// Pass null as the path to skip the request. On reload() the old data stays visible until the new data arrives.
export function useApi(path, deps = []) {
  const [tick, setTick] = useState(0);
  const key = path ? `${path}|${tick}|${JSON.stringify(deps)}` : null;
  const [state, setState] = useState({ key: null, path: null, data: null, error: null });

  useEffect(() => {
    if (!key) return undefined;
    const controller = new AbortController();
    api(path, { signal: controller.signal })
      .then((data) => setState({ key, path, data, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ key, path, data: null, error });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const samePath = path && state.path === path;
  const fresh = key && state.key === key;
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater })), []);

  return {
    data: samePath ? state.data : null,
    error: fresh ? state.error : null,
    loading: Boolean(key) && !fresh && !(samePath && state.data),
    reload,
    setData,
  };
}
