import { useState } from "react";
import { useSWRConfig } from "swr";
import { extractSWRKey } from "swr-catalyst";

type CacheRow = {
  rawKey: string;
  extractedKey: string;
  value: string;
};

function stringifySafe(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function CacheViewer() {
  const { cache } = useSWRConfig();
  const [rows, setRows] = useState<CacheRow[]>([]);

  function refreshRows() {
    const currentRows = Array.from(cache.keys()).map((key) => {
      const rawKey = stringifySafe(key);
      const parsed = extractSWRKey(key);

      return {
        extractedKey: stringifySafe(parsed),
        rawKey,
        value: stringifySafe(cache.get(key)),
      };
    });

    setRows(currentRows);
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Cache Viewer</h2>
        <button onClick={refreshRows} type="button">
          Refresh cache snapshot
        </button>
      </div>
      <p className="muted">
        In-screen guide: run mutations/utilities first, then refresh to inspect
        raw SWR keys, parsed keys, and cache payload changes.
      </p>

      {rows.length === 0 ? (
        <p className="muted">
          No snapshot yet. Click refresh to inspect current SWR cache.
        </p>
      ) : null}

      {rows.map((row, index) => (
        <article className="cacheRow" key={row.rawKey}>
          <h3>Entry {index + 1}</h3>
          <p className="muted">Raw key</p>
          <pre>{row.rawKey}</pre>
          <p className="muted">extractSWRKey</p>
          <pre>{row.extractedKey}</pre>
          <p className="muted">Cache value</p>
          <pre>{row.value}</pre>
        </article>
      ))}
    </section>
  );
}
