import {useCallback, useEffect, useState} from 'react';

export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Manages async data loading with consistent { data, loading, error, refetch } state.
 * Re-runs whenever `fetchFn` identity changes (wrap in useCallback with explicit deps).
 */
export function useAsyncState<T>(fetchFn: () => Promise<T>): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [epoch, setEpoch] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        fetchFn()
            .then(d => { if (active) { setData(d); setError(null); } })
            .catch(e => { if (active) setError(e instanceof Error ? e.message : String(e)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [epoch, fetchFn]);

    const refetch = useCallback(() => setEpoch(e => e + 1), []);

    return {data, loading, error, refetch};
}
