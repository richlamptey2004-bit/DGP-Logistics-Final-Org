import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PublicBootstrapPayload } from '../types/logistics';

interface SiteDataContextValue {
  data: PublicBootstrapPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextValue>({
  data: null,
  loading: true,
  error: null,
  refresh: async () => undefined,
});

export function SiteDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PublicBootstrapPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBootstrap = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/public/bootstrap', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Unable to load site data (HTTP ${res.status}).`);
      }
      const payload = (await res.json()) as PublicBootstrapPayload;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load website data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBootstrap();
  }, [fetchBootstrap]);

  return (
    <SiteDataContext.Provider value={{ data, loading, error, refresh: fetchBootstrap }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
