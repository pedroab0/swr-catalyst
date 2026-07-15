import type { DemoEvent, DemoEventInput } from "@demo/types";
import { useCallback, useRef, useState } from "react";

export function useDemoTimeline() {
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const nextIdRef = useRef(1);

  const addEvent = useCallback((eventInput: DemoEventInput) => {
    const nextEvent: DemoEvent = {
      ...eventInput,
      id: nextIdRef.current++,
      timestamp: Date.now(),
    };

    setEvents((current) => [nextEvent, ...current].slice(0, 60));
    return nextEvent;
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const replayEvent = useCallback(
    async (eventId: number) => {
      const targetEvent = events.find((event) => event.id === eventId);
      if (!(targetEvent?.replayAction && targetEvent.replayable)) {
        return;
      }

      await targetEvent.replayAction();
    },
    [events]
  );

  return {
    addEvent,
    clearEvents,
    events,
    replayEvent,
  };
}
