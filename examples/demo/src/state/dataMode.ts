import type { DemoDataMode } from "../types";

let currentDataMode: DemoDataMode = "inMemory";
let isWorkerStarted = false;

export function getDataMode(): DemoDataMode {
  return currentDataMode;
}

export function setDataMode(nextMode: DemoDataMode): void {
  currentDataMode = nextMode;
}

export async function ensureMswMode(): Promise<{
  enabled: boolean;
  reason?: string;
}> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return {
      enabled: false,
      reason: "Service workers are not available in this environment.",
    };
  }

  if (isWorkerStarted) {
    return { enabled: true };
  }

  try {
    const { worker } = await import("../mocks/browser");

    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: "/mockServiceWorker.js",
      },
    });

    isWorkerStarted = true;

    return { enabled: true };
  } catch (error) {
    return {
      enabled: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
