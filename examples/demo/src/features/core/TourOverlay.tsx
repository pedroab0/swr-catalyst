import { useEffect, useState } from "react";

const TOUR_STORAGE_KEY = "swr-catalyst-demo-tour-dismissed-v1";

function readDismissedState() {
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function persistDismissedState() {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
  } catch {
    // Ignore localStorage errors.
  }
}

export function TourOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readDismissedState());
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <aside
      aria-label="Demo quick tour"
      aria-modal="true"
      className="tourOverlay"
      role="dialog"
    >
      <div className="tourCard panel">
        <h2>Quick tour</h2>
        <p className="muted">
          This one-time guide explains the shortest path to exercise every
          library resource in this demo.
        </p>
        <ol>
          <li>Run Hooks Demo actions with the happy path preset.</li>
          <li>
            Use validation preset or network failure mode to inspect errors.
          </li>
          <li>Use utility actions, then review timeline and cache diff.</li>
        </ol>
        <div className="controls">
          <button
            onClick={() => {
              setVisible(false);
            }}
            type="button"
          >
            Start demo
          </button>
          <button
            onClick={() => {
              persistDismissedState();
              setVisible(false);
            }}
            type="button"
          >
            Do not show again
          </button>
        </div>
      </div>
    </aside>
  );
}
