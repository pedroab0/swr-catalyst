import type { DemoScenario } from "@demo/types";

export const scenarioPresets = [
  {
    id: "happyPath",
    label: "Happy path",
    description: "No failures, no delay.",
    scenario: {
      failureMode: "none",
      delayMs: 0,
    },
  },
  {
    id: "validation",
    label: "Validation errors",
    description: "Mutation endpoints return validation errors.",
    scenario: {
      failureMode: "validation",
      delayMs: 0,
    },
  },
  {
    id: "networkSlow",
    label: "Network slow",
    description: "Successful responses with visible latency.",
    scenario: {
      failureMode: "none",
      delayMs: 1200,
    },
  },
] as const;

let currentScenario: DemoScenario = {
  failureMode: "none",
  delayMs: 0,
};

export function getScenario(): DemoScenario {
  return currentScenario;
}

export function setScenario(nextScenario: DemoScenario): void {
  currentScenario = nextScenario;
}
