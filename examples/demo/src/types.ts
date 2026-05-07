export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  optimistic?: boolean;
};

export type TodoInput = {
  title: string;
  completed?: boolean;
};

export type TodoUpdate = Partial<Pick<Todo, "title" | "completed">>;

export type TodosSummary = {
  total: number;
  completed: number;
  pending: number;
};

export type AppConfig = {
  name: string;
  version: string;
  environment: string;
};

export type FailureMode = "none" | "validation" | "network";

export type DemoScenario = {
  failureMode: FailureMode;
  delayMs: number;
};

export type DemoDataMode = "inMemory" | "msw";

export type ScenarioPresetId = "happyPath" | "validation" | "networkSlow";

export type ScenarioPreset = {
  id: ScenarioPresetId;
  label: string;
  description: string;
  scenario: DemoScenario;
};

export type CacheSnapshotRow = {
  cacheKey: string;
  extractedKey: string;
  value: string;
};

export type CacheSnapshot = {
  capturedAt: number;
  rows: CacheSnapshotRow[];
};

export type CacheDiff = {
  added: CacheSnapshotRow[];
  removed: CacheSnapshotRow[];
  changed: Array<{
    key: string;
    before: string;
    after: string;
  }>;
};

export type DemoEventCategory = "hooks" | "utilities" | "system";
export type DemoEventStatus = "success" | "error" | "warning" | "info";

export type DemoEvent = {
  id: number;
  timestamp: number;
  category: DemoEventCategory;
  action: string;
  status: DemoEventStatus;
  dataMode: DemoDataMode;
  scenario: DemoScenario;
  keyRefs?: string[];
  payloadSummary?: string;
  resultSummary?: string;
  errorSummary?: string;
  cacheDiff?: CacheDiff;
  replayable?: boolean;
  replayAction?: () => Promise<void>;
};

export type DemoEventInput = Omit<DemoEvent, "id" | "timestamp">;

export type DemoToastVariant = "success" | "error" | "warning" | "info";

export type DemoToast = {
  id: number;
  variant: DemoToastVariant;
  message: string;
};
