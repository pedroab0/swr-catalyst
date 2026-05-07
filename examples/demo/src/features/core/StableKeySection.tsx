import { useEffect, useRef, useState } from "react";
import type { SWRKey } from "swr-catalyst";
import { useStableKey } from "swr-catalyst";

type FilterValue = "all" | "completed";

export function StableKeySection() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [rerenderTick, setRerenderTick] = useState(0);

  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const dynamicKey: SWRKey<{ url: string; params: { filter: FilterValue } }> = {
    id: "todos-filtered",
    group: "tasks",
    data: {
      url: "/api/todos",
      params: { filter },
    },
  };

  const stableKey = useStableKey(dynamicKey);
  const previousStableRef = useRef(stableKey);
  const isSameReference = previousStableRef.current === stableKey;

  useEffect(() => {
    previousStableRef.current = stableKey;
  }, [stableKey]);

  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>useStableKey Demo</h2>
        <span className="badge">render #{renderCountRef.current}</span>
      </div>

      <p className="muted">
        In-screen guide: click <code>Re-render only</code> first (reference
        should stay stable), then toggle filter (reference should change).
      </p>

      <div className="controls">
        <button
          onClick={() => setRerenderTick((value) => value + 1)}
          type="button"
        >
          Re-render only ({rerenderTick})
        </button>
        <button
          onClick={() => {
            setFilter((value) => (value === "all" ? "completed" : "all"));
          }}
          type="button"
        >
          Toggle filter ({filter})
        </button>
      </div>

      <dl className="detailsList">
        <div>
          <dt>Reference stable on last render?</dt>
          <dd>{isSameReference ? "yes" : "no"}</dd>
        </div>
      </dl>

      <h3>Stable key value</h3>
      <pre>{JSON.stringify(stableKey, null, 2)}</pre>
    </section>
  );
}
