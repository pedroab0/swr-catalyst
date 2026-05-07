import type { DemoEvent } from "../types";

type ActionTimelineProps = {
  events: DemoEvent[];
  selectedDiffEventId: number | null;
  onClear: () => void;
  onReplay: (eventId: number) => Promise<void>;
  onSelectDiff: (eventId: number) => void;
};

function formatTimestamp(value: number): string {
  return new Date(value).toLocaleTimeString();
}

export function ActionTimeline({
  events,
  selectedDiffEventId,
  onClear,
  onReplay,
  onSelectDiff,
}: ActionTimelineProps) {
  return (
    <section className="panel">
      <div className="panelHeader">
        <h2>Action Timeline</h2>
        <button onClick={onClear} type="button">
          Clear timeline
        </button>
      </div>
      <p className="muted">
        In-screen guide: each hook/utility run creates an event with mode,
        scenario, payload/result summaries, and cache diff metadata.
      </p>

      {events.length === 0 ? (
        <p className="muted">
          No events yet. Run any action in Hooks or Utilities.
        </p>
      ) : null}

      <div className="timelineList">
        {events.map((event) => (
          <article className="timelineItem" key={event.id}>
            <div className="timelineHeader">
              <strong>{event.action}</strong>
              <span className={`statusTag status-${event.status}`}>
                {event.status}
              </span>
            </div>

            <p className="muted">
              {event.category} | {event.dataMode} | {event.scenario.failureMode}{" "}
              | delay {event.scenario.delayMs}ms |{" "}
              {formatTimestamp(event.timestamp)}
            </p>

            {event.payloadSummary ? (
              <p>Payload: {event.payloadSummary}</p>
            ) : null}
            {event.resultSummary ? <p>Result: {event.resultSummary}</p> : null}
            {event.errorSummary ? (
              <p className="error">Error: {event.errorSummary}</p>
            ) : null}

            <div className="controls">
              {event.cacheDiff ? (
                <button
                  className={
                    selectedDiffEventId === event.id
                      ? "timelineAction active"
                      : "timelineAction"
                  }
                  onClick={() => onSelectDiff(event.id)}
                  type="button"
                >
                  Show cache diff
                </button>
              ) : null}

              {event.replayable ? (
                <button
                  onClick={async () => {
                    await onReplay(event.id);
                  }}
                  type="button"
                >
                  Replay
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
