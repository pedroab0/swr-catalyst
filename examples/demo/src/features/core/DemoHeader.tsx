import type {
  AppConfig,
  DemoDataMode,
  FailureMode,
  TodosSummary,
} from "@demo/types";

interface DemoHeaderProps {
  scenario: { failureMode: FailureMode; delayMs: number };
  dataMode: DemoDataMode;
  summary?: TodosSummary;
  summaryLoading: boolean;
  summaryError: unknown;
  appConfig?: AppConfig;
  configError: unknown;
  keyPreview: string;
  onFailureModeChange: (mode: FailureMode) => void;
  onDelayChange: (delay: number) => void;
  onDataModeSelect: (mode: DemoDataMode) => void;
  onResetClick: () => void;
}

export function DemoHeader({
  scenario,
  dataMode,
  summary,
  summaryLoading,
  summaryError,
  appConfig,
  configError,
  keyPreview,
  onFailureModeChange,
  onDelayChange,
  onDataModeSelect,
  onResetClick,
}: DemoHeaderProps) {
  return (
    <header className="hero panel">
      <h1>swr-catalyst demo app</h1>
      <p>
        Single-page showcase for mutation hooks, stable keys, cache utilities,
        and error tooling with in-screen walkthrough text.
      </p>
      <p className="muted">
        Start with <code>Happy path</code>, run Hooks Demo CRUD, then use
        Utilities and inspect timeline/cache diff.
      </p>

      <div className="controls heroControls">
        <label>
          Failure mode
          <select
            onChange={(event) =>
              onFailureModeChange(event.target.value as FailureMode)
            }
            value={scenario.failureMode}
          >
            <option value="none">none</option>
            <option value="validation">validation</option>
            <option value="network">network</option>
          </select>
        </label>

        <label>
          Delay (ms)
          <input
            max={3000}
            min={0}
            onChange={(event) =>
              onDelayChange(Number(event.target.value) || 0)
            }
            step={100}
            type="number"
            value={scenario.delayMs}
          />
        </label>

        <label>
          Data mode
          <select
            onChange={(event) =>
              onDataModeSelect(event.target.value as DemoDataMode)
            }
            value={dataMode}
          >
            <option value="inMemory">inMemory (direct functions)</option>
            <option value="msw">msw (fetch + mock service worker)</option>
          </select>
        </label>

        <button onClick={onResetClick} type="button">
          Reset demo state
        </button>
      </div>

      <dl className="stats">
        <div>
          <dt>Total</dt>
          <dd>{summaryLoading ? "-" : (summary?.total ?? 0)}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{summaryLoading ? "-" : (summary?.completed ?? 0)}</dd>
        </div>
        <div>
          <dt>Pending</dt>
          <dd>{summaryLoading ? "-" : (summary?.pending ?? 0)}</dd>
        </div>
        <div>
          <dt>Config env</dt>
          <dd>{appConfig?.environment ?? "-"}</dd>
        </div>
      </dl>

      {summaryError ? (
        <p className="error">Summary error: {String(summaryError)}</p>
      ) : null}
      {configError ? (
        <p className="error">Config error: {String(configError)}</p>
      ) : null}

      <h2>Structured keys (SWRKey)</h2>
      <pre>{keyPreview}</pre>
    </header>
  );
}
