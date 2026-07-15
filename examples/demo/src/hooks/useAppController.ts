import { fetchAppConfig, fetchTodosSummary } from "@demo/api/fetchers";
import { useCacheSnapshots } from "@demo/features/cache/useCacheSnapshots";
import { useStatusToasts } from "@demo/features/core/useStatusToasts";
import { scenarioPresets } from "@demo/features/scenario/scenario";
import { useDemoScenario } from "@demo/features/scenario/useDemoScenario";
import { useDemoTimeline } from "@demo/features/timeline/useDemoTimeline";
import { appConfigKey, todosKey, todosSummaryKey } from "@demo/keys";
import { resetDemoData } from "@demo/mocks/dataStore";
import type {
  AppConfig,
  DemoDataMode,
  DemoEventInput,
  DemoScenario,
  FailureMode,
  ScenarioPresetId,
  TodosSummary,
} from "@demo/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { resetCache } from "swr-catalyst";

type AppEventInput = Omit<DemoEventInput, "dataMode" | "scenario">;
type AppEventContext = {
  dataMode?: DemoDataMode;
  scenario?: DemoScenario;
};

function toToastVariant(status: AppEventInput["status"]) {
  if (status === "error") {
    return "error" as const;
  }

  if (status === "warning") {
    return "warning" as const;
  }

  if (status === "info") {
    return "info" as const;
  }

  return "success" as const;
}

function toToastMessage(event: AppEventInput) {
  if (event.status === "error") {
    return `${event.action}: ${event.errorSummary ?? "failed"}`;
  }

  return `${event.action}: ${event.resultSummary ?? event.status}`;
}

export function useAppController() {
  const [lastError, setLastError] = useState<unknown | null>(null);
  const [selectedDiffEventId, setSelectedDiffEventId] = useState<number | null>(
    null
  );

  const { mutate } = useSWRConfig();
  const { toasts, pushToast, dismissToast } = useStatusToasts();
  const { events, addEvent, clearEvents, replayEvent } = useDemoTimeline();
  const { takeSnapshot, createDiff } = useCacheSnapshots();

  const onModeFallback = useCallback(
    (reason: string) => {
      pushToast("warning", `MSW mode is unavailable: ${reason}`);
    },
    [pushToast]
  );

  const {
    scenario,
    dataMode,
    presetList,
    setFailureMode,
    setDelayMs,
    applyPreset,
    switchMode,
  } = useDemoScenario({ onModeFallback });

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useSWR<TodosSummary>(todosSummaryKey, fetchTodosSummary);

  const { data: appConfig, error: configError } = useSWR<AppConfig>(
    appConfigKey,
    fetchAppConfig
  );

  const reportEvent = useCallback(
    (event: AppEventInput, context: AppEventContext = {}) => {
      addEvent({
        ...event,
        dataMode: context.dataMode ?? dataMode,
        scenario: context.scenario ?? scenario,
      });

      pushToast(toToastVariant(event.status), toToastMessage(event));
    },
    [addEvent, dataMode, pushToast, scenario]
  );

  useEffect(() => {
    if (
      selectedDiffEventId &&
      !events.some((event) => event.id === selectedDiffEventId)
    ) {
      setSelectedDiffEventId(null);
    }

    if (!selectedDiffEventId) {
      const firstWithDiff = events.find((event) => event.cacheDiff);
      if (firstWithDiff) {
        setSelectedDiffEventId(firstWithDiff.id);
      }
    }
  }, [events, selectedDiffEventId]);

  const syncCoreCaches = useCallback(async () => {
    await Promise.all([
      mutate(todosKey),
      mutate(todosSummaryKey),
      mutate(appConfigKey),
    ]);
  }, [mutate]);

  function handleFailureModeChange(nextFailureMode: FailureMode) {
    const nextScenario = {
      ...scenario,
      failureMode: nextFailureMode,
    };
    setFailureMode(nextFailureMode);

    reportEvent(
      {
        action: "Set failure mode",
        category: "system",
        keyRefs: ["scenario"],
        payloadSummary: nextFailureMode,
        resultSummary: `Failure mode set to ${nextFailureMode}`,
        status: "info",
      },
      {
        scenario: nextScenario,
      }
    );
  }

  function handleDelayChange(nextDelayMs: number) {
    const nextScenario = {
      ...scenario,
      delayMs: nextDelayMs,
    };
    setDelayMs(nextDelayMs);

    reportEvent(
      {
        action: "Set delay",
        category: "system",
        keyRefs: ["scenario"],
        payloadSummary: `${nextDelayMs}ms`,
        resultSummary: `Delay set to ${nextDelayMs}ms`,
        status: "info",
      },
      {
        scenario: nextScenario,
      }
    );
  }

  function handleApplyPreset(presetId: ScenarioPresetId) {
    const preset = presetList.find((candidate) => candidate.id === presetId);
    if (!preset) {
      return;
    }

    applyPreset(presetId);

    reportEvent(
      {
        action: "Apply scenario preset",
        category: "system",
        keyRefs: ["scenario"],
        payloadSummary: preset.label,
        resultSummary: `${preset.scenario.failureMode} with ${preset.scenario.delayMs}ms delay`,
        status: "info",
      },
      {
        scenario: preset.scenario,
      }
    );
  }

  const handleSwitchDataMode = useCallback(
    async (nextMode: DemoDataMode) => {
      const before = takeSnapshot();
      const resolvedMode = await switchMode(nextMode);
      await syncCoreCaches();
      const after = takeSnapshot();
      const failedToSwitch = resolvedMode !== nextMode;

      reportEvent(
        {
          action: "Switch data mode",
          cacheDiff: createDiff(before, after),
          category: "system",
          keyRefs: ["mode", "todos", "todos-summary", "app-config"],
          payloadSummary: nextMode,
          replayAction: async () => {
            await handleSwitchDataMode(nextMode);
          },
          replayable: true,
          resultSummary: failedToSwitch
            ? `Fallback to ${resolvedMode}`
            : `Now using ${resolvedMode}`,
          status: failedToSwitch ? "warning" : "success",
        },
        {
          dataMode: resolvedMode,
        }
      );
    },
    [createDiff, reportEvent, switchMode, syncCoreCaches, takeSnapshot]
  );

  const handleResetDemo = useCallback(async () => {
    const before = takeSnapshot();

    resetDemoData();
    applyPreset("happyPath");
    setLastError(null);

    clearEvents();
    setSelectedDiffEventId(null);

    await resetCache();
    await syncCoreCaches();

    const after = takeSnapshot();
    const resetScenario = scenarioPresets.find(
      (preset) => preset.id === "happyPath"
    )?.scenario ?? {
      delayMs: 0,
      failureMode: "none",
    };

    const resetEvent = addEvent({
      action: "Reset demo state",
      cacheDiff: createDiff(before, after),
      category: "system",
      dataMode,
      keyRefs: ["todos", "todos-summary", "app-config"],
      payloadSummary: "happyPath + clear cache",
      resultSummary: "Todos, scenario, and cache returned to baseline",
      scenario: resetScenario,
      status: "success",
    });

    if (resetEvent.cacheDiff) {
      setSelectedDiffEventId(resetEvent.id);
    }

    pushToast("success", "Demo state reset to the happy path baseline.");
  }, [
    addEvent,
    applyPreset,
    clearEvents,
    createDiff,
    dataMode,
    pushToast,
    syncCoreCaches,
    takeSnapshot,
  ]);

  async function handleReplayEvent(eventId: number) {
    const before = takeSnapshot();

    try {
      await replayEvent(eventId);
      const after = takeSnapshot();

      reportEvent({
        action: "Replay timeline event",
        cacheDiff: createDiff(before, after),
        category: "system",
        keyRefs: ["timeline"],
        payloadSummary: `eventId=${eventId}`,
        resultSummary: `Replayed event ${eventId}`,
        status: "success",
      });
    } catch (error) {
      const after = takeSnapshot();
      const errorMessage =
        error instanceof Error ? error.message : "Replay failed.";

      setLastError(error);
      reportEvent({
        action: "Replay timeline event",
        cacheDiff: createDiff(before, after),
        category: "system",
        errorSummary: errorMessage,
        keyRefs: ["timeline"],
        payloadSummary: `eventId=${eventId}`,
        status: "error",
      });
    }
  }

  const handleDataModeSelect = useCallback(
    (nextMode: DemoDataMode) => {
      handleSwitchDataMode(nextMode).catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to switch data mode.";
        setLastError(error);
        pushToast("error", message);
      });
    },
    [handleSwitchDataMode, pushToast]
  );

  const handleResetClick = useCallback(() => {
    handleResetDemo().catch((error) => {
      const message =
        error instanceof Error ? error.message : "Failed to reset demo.";
      setLastError(error);
      pushToast("error", message);
    });
  }, [handleResetDemo, pushToast]);

  const keyPreview = useMemo(
    () =>
      JSON.stringify(
        {
          appConfigKey,
          todosKey,
          todosSummaryKey,
        },
        null,
        2
      ),
    []
  );

  const selectedDiffEvent = useMemo(
    () => events.find((event) => event.id === selectedDiffEventId) ?? null,
    [events, selectedDiffEventId]
  );

  return {
    appConfig,
    clearEvents,
    configError,
    dataMode,
    dismissToast,
    events,
    handleApplyPreset,
    handleDataModeSelect,
    handleDelayChange,
    handleFailureModeChange,
    handleReplayEvent,
    handleResetClick,
    keyPreview,
    lastError,
    presetList,
    pushToast,
    reportEvent,
    scenario,
    selectedDiffEvent,
    selectedDiffEventId,
    setLastError,
    setSelectedDiffEventId,
    summary,
    summaryError,
    summaryLoading,
    toasts,
  };
}
