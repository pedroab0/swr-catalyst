import {
  captureCacheSnapshot,
  createCacheDiff,
} from "@demo/utils/cacheSnapshot";
import { useSWRConfig } from "swr";

export function useCacheSnapshots() {
  const { cache } = useSWRConfig();

  function takeSnapshot() {
    return captureCacheSnapshot(cache);
  }

  return {
    createDiff: createCacheDiff,
    takeSnapshot,
  };
}
