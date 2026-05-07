import type { DemoEvent } from "../types";

type CacheDiffViewerProps = {
  event: DemoEvent | null;
};

export function CacheDiffViewer({ event }: CacheDiffViewerProps) {
  if (!event?.cacheDiff) {
    return (
      <section className="panel">
        <h2>Cache Diff Viewer</h2>
        <p className="muted">
          Select a timeline event with cache changes to inspect added, removed,
          and changed cache entries.
        </p>
      </section>
    );
  }

  const { added, removed, changed } = event.cacheDiff;

  return (
    <section className="panel">
      <h2>Cache Diff Viewer</h2>
      <p className="muted">
        Event #{event.id}: <code>{event.action}</code>
      </p>

      <dl className="detailsList compact">
        <div>
          <dt>Added keys</dt>
          <dd>{added.length}</dd>
        </div>
        <div>
          <dt>Removed keys</dt>
          <dd>{removed.length}</dd>
        </div>
        <div>
          <dt>Changed keys</dt>
          <dd>{changed.length}</dd>
        </div>
      </dl>

      <details>
        <summary>Added</summary>
        <pre>{JSON.stringify(added, null, 2)}</pre>
      </details>

      <details>
        <summary>Removed</summary>
        <pre>{JSON.stringify(removed, null, 2)}</pre>
      </details>

      <details>
        <summary>Changed</summary>
        <pre>{JSON.stringify(changed, null, 2)}</pre>
      </details>
    </section>
  );
}
