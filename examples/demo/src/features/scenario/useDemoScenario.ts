import {
  ensureMswMode,
  getDataMode,
  setDataMode,
} from "@demo/features/core/dataMode";
import type { DemoDataMode, DemoScenario, FailureMode } from "@demo/types";
import { useMemo, useState } from "react";

import { getScenario, scenarioPresets, setScenario } from "./scenario";

type UseDemoScenarioParams = {
  onModeFallback: (reason: string) => void;
};

export function useDemoScenario({ onModeFallback }: UseDemoScenarioParams) {
  const [scenario, setScenarioState] = useState<DemoScenario>(getScenario());
  const [dataMode, setDataModeState] = useState<DemoDataMode>(getDataMode());

  const presetList = useMemo(() => [...scenarioPresets], []);

  function setFailureMode(nextFailureMode: FailureMode) {
    setScenarioState((currentScenario) => {
      const nextScenario = {
        ...currentScenario,
        failureMode: nextFailureMode,
      };
      setScenario(nextScenario);
      return nextScenario;
    });
  }

  function setDelayMs(nextDelayMs: number) {
    setScenarioState((currentScenario) => {
      const nextScenario = {
        ...currentScenario,
        delayMs: nextDelayMs,
      };
      setScenario(nextScenario);
      return nextScenario;
    });
  }

  function applyPreset(presetId: (typeof scenarioPresets)[number]["id"]) {
    const selectedPreset = presetList.find((preset) => preset.id === presetId);
    if (!selectedPreset) {
      return;
    }

    setScenarioState(selectedPreset.scenario);
    setScenario(selectedPreset.scenario);
  }

  async function switchMode(nextMode: DemoDataMode) {
    if (nextMode === "inMemory") {
      setDataMode("inMemory");
      setDataModeState("inMemory");
      return "inMemory" as const;
    }

    const result = await ensureMswMode();
    if (!result.enabled) {
      setDataMode("inMemory");
      setDataModeState("inMemory");
      onModeFallback(result.reason ?? "MSW mode failed to start.");
      return "inMemory" as const;
    }

    setDataMode("msw");
    setDataModeState("msw");
    return "msw" as const;
  }

  return {
    applyPreset,
    dataMode,
    presetList,
    scenario,
    setDelayMs,
    setFailureMode,
    switchMode,
  };
}
