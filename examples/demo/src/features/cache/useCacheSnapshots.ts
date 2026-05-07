import { useSWRConfig } from "swr";

import { captureCacheSnapshot, createCacheDiff } from "@demo/utils/cacheSnapshot";

export function useCacheSnapshots() {
  const { cache } = useSWRConfig();

  function takeSnapshot() {
    return captureCacheSnapshot(cache);
  }

  return {
    takeSnapshot,
    createDiff: createCacheDiff,
  };
}
