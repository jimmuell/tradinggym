import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SignedGuruAssetMap {
  [path: string]: string;
}

interface SignResponse {
  signed: Record<string, { url: string; expiresAt: number }>;
  denied: string[];
}

const STALE_MS = 3 * 60 * 1000; // 3 min
const REFETCH_MS = 3.5 * 60 * 1000; // 3.5 min (before 5-min TTL expires)

/**
 * Given a list of paths from slides marked with the `private://` scheme,
 * returns a byte-for-byte map from path -> current signed URL. Rotates URLs
 * before their 5-minute TTL expires and preserves the previous URL during
 * the swap so <img> elements do not flicker or break.
 */
export function useSignedGuruAssets(lessonId: string | undefined, paths: string[]) {
  const { user } = useAuth();
  const previousResolved = useRef<SignedGuruAssetMap>({});

  // Stable, sorted key so identical path sets share a cache entry.
  const sortedPaths = useMemo(() => [...new Set(paths)].sort(), [paths]);
  const enabled = !!user?.id && !!lessonId && sortedPaths.length > 0;

  const query = useQuery({
    queryKey: ['guru-signed-urls', lessonId, user?.id, sortedPaths],
    enabled,
    staleTime: STALE_MS,
    refetchInterval: REFETCH_MS,
    refetchIntervalInBackground: false,
    queryFn: async (): Promise<SignedGuruAssetMap> => {
      const { data, error } = await supabase.functions.invoke<SignResponse>(
        'sign-guru-asset',
        { body: { paths: sortedPaths } },
      );
      if (error) throw error;
      const map: SignedGuruAssetMap = {};
      for (const [p, v] of Object.entries(data?.signed ?? {})) {
        map[p] = v.url;
      }
      return map;
    },
  });

  // Merge new URLs over the previous map so a mid-view rotation never leaves
  // an <img> without a src.
  const resolved = useMemo(() => {
    if (query.data) {
      previousResolved.current = { ...previousResolved.current, ...query.data };
    }
    return previousResolved.current;
  }, [query.data]);

  return {
    resolved,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
