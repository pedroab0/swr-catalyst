import type { CacheDiff, CacheSnapshot, CacheSnapshotRow } from "@demo/types";
import type { Cache } from "swr";
import { extractSWRKey } from "swr-catalyst";

function stringifySafe(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function captureCacheSnapshot(cache: Cache): CacheSnapshot {
  const rows = Array.from(cache.keys())
    .map((key) => {
      const extracted = extractSWRKey(key);

      return {
        cacheKey: stringifySafe(key),
        extractedKey: stringifySafe(extracted),
        value: stringifySafe(cache.get(key)),
      };
    })
    .sort((a, b) => a.cacheKey.localeCompare(b.cacheKey));

  return {
    capturedAt: Date.now(),
    rows,
  };
}

function toMap(rows: CacheSnapshotRow[]) {
  return new Map(rows.map((row) => [row.cacheKey, row]));
}

export function createCacheDiff(
  before: CacheSnapshot,
  after: CacheSnapshot
): CacheDiff {
  const beforeMap = toMap(before.rows);
  const afterMap = toMap(after.rows);

  const added: CacheSnapshotRow[] = [];
  const removed: CacheSnapshotRow[] = [];
  const changed: CacheDiff["changed"] = [];

  for (const [cacheKey, afterRow] of afterMap) {
    const beforeRow = beforeMap.get(cacheKey);
    if (!beforeRow) {
      added.push(afterRow);
      continue;
    }

    if (beforeRow.value !== afterRow.value) {
      changed.push({
        after: afterRow.value,
        before: beforeRow.value,
        key: cacheKey,
      });
    }
  }

  for (const [cacheKey, beforeRow] of beforeMap) {
    if (!afterMap.has(cacheKey)) {
      removed.push(beforeRow);
    }
  }

  return { added, changed, removed };
}
