import type { DemoScenario } from "@demo/types";

export const scenarioPresets = [
  {
    description: "No failures, no delay.",
    id: "happyPath",
    label: "Happy path",
    scenario: {
      delayMs: 0,
      failureMode: "none",
    },
  },
  {
    description: "Mutation endpoints return validation errors.",
    id: "validation",
    label: "Validation errors",
    scenario: {
      delayMs: 0,
      failureMode: "validation",
    },
  },
  {
    description: "Successful responses with visible latency.",
    id: "networkSlow",
    label: "Network slow",
    scenario: {
      delayMs: 1200,
      failureMode: "none",
    },
  },
] as const;

let currentScenario: DemoScenario = {
  delayMs: 0,
  failureMode: "none",
};

export function getScenario(): DemoScenario {
  return currentScenario;
}

export function setScenario(nextScenario: DemoScenario): void {
  currentScenario = nextScenario;
}
