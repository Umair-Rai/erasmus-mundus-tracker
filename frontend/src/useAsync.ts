import { useEffect, useState } from "react";

interface AsyncState<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    load(controller.signal).then(
      (data) => setState({ data, loading: false }),
      (err: Error) => {
        if (!controller.signal.aborted) setState({ error: err.message, loading: false });
      },
    );
    return () => controller.abort();
  }, deps);

  return state;
}
