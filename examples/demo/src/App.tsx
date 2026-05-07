import { useAppController } from "@demo/hooks/useAppController";

import { ActionTimeline } from "@demo/features/timeline/ActionTimeline";
import { CacheDiffViewer } from "@demo/features/cache/CacheDiffViewer";
import { CacheViewer } from "@demo/features/cache/CacheViewer";
import { ErrorInspector } from "@demo/features/core/ErrorInspector";
import { ScenarioPresets } from "@demo/features/scenario/ScenarioPresets";
import { StableKeySection } from "@demo/features/core/StableKeySection";
import { StatusToastRegion } from "@demo/features/core/StatusToastRegion";
import { TodoSection } from "@demo/features/todos/TodoSection";
import { TourOverlay } from "@demo/features/core/TourOverlay";
import { UtilitiesSection } from "@demo/features/core/UtilitiesSection";
import { DemoHeader } from "@demo/features/core/DemoHeader";
import { DemoInstructions } from "@demo/features/core/DemoInstructions";

export default function App() {
  const {
    lastError,
    setLastError,
    selectedDiffEventId,
    setSelectedDiffEventId,
    toasts,
    dismissToast,
    events,
    clearEvents,
    scenario,
    dataMode,
    presetList,
    summary,
    summaryLoading,
    summaryError,
    appConfig,
    configError,
    reportEvent,
    handleFailureModeChange,
    handleDelayChange,
    handleApplyPreset,
    handleReplayEvent,
    handleDataModeSelect,
    handleResetClick,
    keyPreview,
    selectedDiffEvent,
  } = useAppController();

  return (
    <main className="layout">
      <TourOverlay />
      <StatusToastRegion onDismiss={dismissToast} toasts={toasts} />

      <DemoHeader
        appConfig={appConfig}
        configError={configError}
        dataMode={dataMode}
        keyPreview={keyPreview}
        onDataModeSelect={handleDataModeSelect}
        onDelayChange={handleDelayChange}
        onFailureModeChange={handleFailureModeChange}
        onResetClick={handleResetClick}
        scenario={scenario}
        summary={summary}
        summaryError={summaryError}
        summaryLoading={summaryLoading}
      />

      <DemoInstructions />

      <ScenarioPresets
        activeScenario={scenario}
        onApplyPreset={handleApplyPreset}
        presets={presetList}
      />

      <TodoSection onActionEvent={reportEvent} onMutationError={setLastError} />
      <UtilitiesSection
        onActionEvent={reportEvent}
        onMutationError={setLastError}
      />

      <ErrorInspector error={lastError} onClear={() => setLastError(null)} />
      <ActionTimeline
        events={events}
        onClear={clearEvents}
        onReplay={handleReplayEvent}
        onSelectDiff={setSelectedDiffEventId}
        selectedDiffEventId={selectedDiffEventId}
      />
      <CacheDiffViewer event={selectedDiffEvent} />
      <StableKeySection />
      <CacheViewer />
    </main>
  );
}
