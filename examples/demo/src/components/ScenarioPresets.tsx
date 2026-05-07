import type { DemoScenario, ScenarioPreset, ScenarioPresetId } from "../types";

type ScenarioPresetsProps = {
  activeScenario: DemoScenario;
  presets: readonly ScenarioPreset[];
  onApplyPreset: (presetId: ScenarioPresetId) => void;
};

function isPresetActive(preset: ScenarioPreset, scenario: DemoScenario) {
  return (
    preset.scenario.failureMode === scenario.failureMode &&
    preset.scenario.delayMs === scenario.delayMs
  );
}

export function ScenarioPresets({
  activeScenario,
  presets,
  onApplyPreset,
}: ScenarioPresetsProps) {
  return (
    <section className="panel">
      <h2>Scenario Presets</h2>
      <p className="muted">
        In-screen guide: choose a preset first, then run hooks/utilities to see
        the expected behavior quickly.
      </p>

      <div className="presetGrid">
        {presets.map((preset) => {
          const isActive = isPresetActive(preset, activeScenario);

          return (
            <button
              className={isActive ? "presetButton active" : "presetButton"}
              key={preset.id}
              onClick={() => onApplyPreset(preset.id)}
              type="button"
            >
              <span>{preset.label}</span>
              <small>{preset.description}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
