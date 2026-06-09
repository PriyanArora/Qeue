import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/api';

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: (updater: T | ((prev: T | null) => T)) => void;
}

/**
 * Runs `fn` on mount and whenever `deps` change, exposing loading/error/data.
 * `fn` receives an AbortSignal so in-flight requests are cancelled on unmount.
 */
export function useApi<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fnRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setDataState(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted || (err as Error).name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Something went wrong.');
        setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((updater: T | ((prev: T | null) => T)) => {
    setDataState((prev) =>
      typeof updater === 'function' ? (updater as (p: T | null) => T)(prev) : updater,
    );
  }, []);

  return { data, error, loading, reload, setData };
}
