import { useState } from "react";
import { type Key, unstable_serialize, useSWRConfig } from "swr";
import {
  extractSWRKey,
  MutationError,
  mutateByGroup,
  mutateById,
  resetCache,
  swrGetCache,
  swrMutate,
} from "swr-catalyst";

import type { DemoEventInput, Todo } from "@demo/types";

import { useCacheSnapshots } from "@demo/features/cache/useCacheSnapshots";

import { appConfigKey, todosKey, todosSummaryKey } from "@demo/keys";

type CacheEntryValue<TData> = {
  data?: TData;
};

type UtilitiesEventInput = Omit<DemoEventInput, "dataMode" | "scenario">;

type UtilitiesSectionProps = {
  onActionEvent: (event: UtilitiesEventInput) => void;
  onMutationError: (error: unknown) => void;
};

function parseCommaSeparatedList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveTodosFromCache(entry: unknown): Todo[] {
  if (Array.isArray(entry)) {
    return entry as Todo[];
  }

  if (entry && typeof entry === "object" && "data" in entry) {
    const withData = entry as CacheEntryValue<Todo[]>;
    return Array.isArray(withData.data) ? withData.data : [];
  }

  return [];
}

export function UtilitiesSection({
  onActionEvent,
  onMutationError,
}: UtilitiesSectionProps) {
  const { cache, mutate } = useSWRConfig();
  const { takeSnapshot, createDiff } = useCacheSnapshots();

  const [statusMessage, setStatusMessage] = useState(
    "No utility action executed yet."
  );
  const [cacheValue, setCacheValue] = useState("[]");
  const [serializedKey, setSerializedKey] = useState("");
  const [extractedKey, setExtractedKey] = useState("null");
  const [targetIdsInput, setTargetIdsInput] = useState("todos,todos-summary");
  const [targetGroupsInput, setTargetGroupsInput] = useState("tasks");
  const [injectedTitle, setInjectedTitle] = useState(
    "Injected via swrMutate()"
  );

  function readTodosFromCache() {
    const cacheEntry = swrGetCache(cache, todosKey);
    return resolveTodosFromCache(cacheEntry);
  }

  function readAndDisplayCache() {
    setCacheValue(JSON.stringify(readTodosFromCache(), null, 2));
  }

  function captureMutationError(error: unknown) {
    onMutationError(error);

    if (error instanceof MutationError) {
      setStatusMessage(`Utility failed: ${error.getUserMessage()}`);
      return;
    }

    if (error instanceof Error) {
      setStatusMessage(`Utility failed: ${error.message}`);
      return;
    }

    setStatusMessage("Utility failed with unknown error.");
  }

  async function runTrackedUtility<TResult>(params: {
    action: string;
    payloadSummary?: string;
    keyRefs: string[];
    execute: () => Promise<TResult>;
    resultSummary: (result: TResult) => string;
    replayable?: boolean;
    replayAction?: () => Promise<void>;
  }) {
    const before = takeSnapshot();

    try {
      const result = await params.execute();
      const after = takeSnapshot();
      const message = params.resultSummary(result);

      setStatusMessage(message);
      onActionEvent({
        category: "utilities",
        action: params.action,
        status: "success",
        payloadSummary: params.payloadSummary,
        resultSummary: message,
        keyRefs: params.keyRefs,
        cacheDiff: createDiff(before, after),
        replayable: Boolean(params.replayable),
        replayAction: params.replayAction,
      });

      return result;
    } catch (error) {
      const after = takeSnapshot();
      const errorMessage =
        error instanceof Error ? error.message : "Unknown utility error.";

      captureMutationError(error);
      onActionEvent({
        category: "utilities",
        action: params.action,
        status: "error",
        payloadSummary: params.payloadSummary,
        errorSummary: errorMessage,
        keyRefs: params.keyRefs,
        cacheDiff: createDiff(before, after),
      });

      return null;
    }
  }

  async function revalidateById() {
    const ids = parseCommaSeparatedList(targetIdsInput);
    if (ids.length === 0) {
      setStatusMessage("Provide at least one id (comma-separated).");
      return;
    }

    await runTrackedUtility({
      action: "mutateById revalidate",
      payloadSummary: ids.join(", "),
      keyRefs: ids,
      execute: async () => {
        await mutateById(ids.length === 1 ? ids[0] : ids);
        return ids;
      },
      resultSummary: (result) =>
        `mutateById revalidated ${result.length} target id(s).`,
      replayable: true,
      replayAction: async () => {
        await revalidateById();
      },
    });
  }

  async function revalidateByGroup() {
    const groups = parseCommaSeparatedList(targetGroupsInput);
    if (groups.length === 0) {
      setStatusMessage("Provide at least one group (comma-separated).");
      return;
    }

    await runTrackedUtility({
      action: "mutateByGroup revalidate",
      payloadSummary: groups.join(", "),
      keyRefs: groups,
      execute: async () => {
        await mutateByGroup(groups.length === 1 ? groups[0] : groups);
        return groups;
      },
      resultSummary: (result) =>
        `mutateByGroup revalidated ${result.length} group(s).`,
      replayable: true,
      replayAction: async () => {
        await revalidateByGroup();
      },
    });
  }

  async function updateByIdWithoutRevalidate() {
    const currentTodos = readTodosFromCache();
    if (currentTodos.length === 0) {
      setStatusMessage("No cached todos to update. Load todos first.");
      return;
    }

    const nextTodos = currentTodos.map((todo) => ({
      ...todo,
      completed: true,
    }));

    await runTrackedUtility({
      action: "mutateById update without revalidate",
      payloadSummary: `todos count=${currentTodos.length}`,
      keyRefs: ["todos"],
      execute: async () => {
        await mutateById("todos", nextTodos, {
          revalidate: false,
        });
        readAndDisplayCache();
        return nextTodos;
      },
      resultSummary: (result) =>
        `mutateById wrote ${result.length} todos (all completed=true) without revalidation.`,
      replayable: true,
      replayAction: async () => {
        await updateByIdWithoutRevalidate();
      },
    });
  }

  async function writeWithSWRMutate() {
    const currentTodos = readTodosFromCache();
    const optimisticTodo: Todo = {
      id: Date.now(),
      title: injectedTitle.trim() || "Injected via swrMutate()",
      completed: false,
      optimistic: true,
    };

    await runTrackedUtility({
      action: "swrMutate write",
      payloadSummary: JSON.stringify(optimisticTodo),
      keyRefs: ["todos"],
      execute: async () => {
        await swrMutate(
          mutate,
          todosKey,
          [...currentTodos, optimisticTodo],
          false
        );
        readAndDisplayCache();
        return optimisticTodo;
      },
      resultSummary: (result) =>
        `swrMutate wrote optimistic todo #${result.id}.`,
      replayable: true,
      replayAction: async () => {
        await writeWithSWRMutate();
      },
    });
  }

  async function preserveConfigAndResetCache() {
    await runTrackedUtility({
      action: "resetCache preserve app-config",
      payloadSummary: "preserve=app-config",
      keyRefs: ["app-config"],
      execute: async () => {
        await resetCache(["app-config"]);
        await mutate(todosKey);
        await mutate(todosSummaryKey);
        readAndDisplayCache();
        return true;
      },
      resultSummary: () =>
        "resetCache cleared entries except app-config and refetched todo caches.",
    });
  }

  async function runBatchScenario() {
    const ids = parseCommaSeparatedList(targetIdsInput);
    const groups = parseCommaSeparatedList(targetGroupsInput);

    if (ids.length === 0 && groups.length === 0) {
      setStatusMessage("Provide at least one id or group for batch scenario.");
      return;
    }

    await runTrackedUtility({
      action: "Run utilities batch scenario",
      payloadSummary: `ids=[${ids.join(", ")}], groups=[${groups.join(", ")}]`,
      keyRefs: [...ids, ...groups],
      execute: async () => {
        if (ids.length > 0) {
          await mutateById(ids.length === 1 ? ids[0] : ids);
        }

        if (groups.length > 0) {
          await mutateByGroup(groups.length === 1 ? groups[0] : groups);
        }

        readAndDisplayCache();

        return {
          ids,
          groups,
        };
      },
      resultSummary: (result) =>
        `Batch scenario finished for ${result.ids.length} id(s) and ${result.groups.length} group(s).`,
      replayable: true,
      replayAction: async () => {
        await runBatchScenario();
      },
    });
  }

  function parseSerializedKey() {
    const before = takeSnapshot();
    const serialized = unstable_serialize(todosSummaryKey as Key);
    const extracted = extractSWRKey(serialized);

    setSerializedKey(serialized);
    setExtractedKey(JSON.stringify(extracted, null, 2));

    const after = takeSnapshot();

    onActionEvent({
      category: "utilities",
      action: "extractSWRKey parse",
      status: "info",
      payloadSummary: "todos-summary",
      resultSummary: "Serialized key parsed with extractSWRKey.",
      keyRefs: ["todos-summary"],
      cacheDiff: createDiff(before, after),
    });

    setStatusMessage("Serialized key parsed with extractSWRKey.");
  }

  function inspectConfigCache() {
    const before = takeSnapshot();
    const configEntry = swrGetCache(cache, appConfigKey);
    const message = `Config cache entry: ${JSON.stringify(configEntry ?? null, null, 2)}`;

    setStatusMessage(message);

    const after = takeSnapshot();
    onActionEvent({
      category: "utilities",
      action: "Inspect app-config cache",
      status: "info",
      resultSummary: "Read app-config cache entry.",
      keyRefs: ["app-config"],
      cacheDiff: createDiff(before, after),
    });
  }

  return (
    <section className="panel">
      <h2>Utilities Demo</h2>
      <p className="muted">
        In-screen guide: set target ids/groups, run utilities top-to-bottom,
        then inspect timeline and cache diff to understand each effect.
      </p>
      <ul className="commentList">
        <li>
          <code>mutateById</code> can revalidate one id or multiple ids.
        </li>
        <li>
          <code>mutateByGroup</code> can target one group or multiple groups.
        </li>
        <li>
          Batch scenario combines id/group revalidation in one tracked run.
        </li>
        <li>
          <code>swrGetCache</code>, <code>swrMutate</code>, and{" "}
          <code>extractSWRKey</code> expose low-level cache behavior.
        </li>
      </ul>

      <div className="utilitiesActions">
        <div className="controls">
          <label>
            Target key ids
            <input
              onChange={(event) => setTargetIdsInput(event.target.value)}
              placeholder="todos,todos-summary"
              value={targetIdsInput}
            />
          </label>
          <label>
            Target groups
            <input
              onChange={(event) => setTargetGroupsInput(event.target.value)}
              placeholder="tasks"
              value={targetGroupsInput}
            />
          </label>
          <label>
            Injected todo title
            <input
              onChange={(event) => setInjectedTitle(event.target.value)}
              placeholder="Injected via swrMutate()"
              value={injectedTitle}
            />
          </label>
        </div>

        <div className="controls">
          <button
            onClick={async () => {
              await revalidateById();
            }}
            type="button"
          >
            mutateById revalidate
          </button>
          <button
            onClick={async () => {
              await revalidateByGroup();
            }}
            type="button"
          >
            mutateByGroup revalidate
          </button>
          <button
            onClick={async () => {
              await updateByIdWithoutRevalidate();
            }}
            type="button"
          >
            mutateById update
          </button>
          <button
            onClick={async () => {
              await writeWithSWRMutate();
            }}
            type="button"
          >
            swrMutate write
          </button>
          <button
            onClick={async () => {
              await preserveConfigAndResetCache();
            }}
            type="button"
          >
            resetCache preserve app-config
          </button>
          <button
            onClick={async () => {
              await runBatchScenario();
            }}
            type="button"
          >
            run batch scenario
          </button>
          <button onClick={readAndDisplayCache} type="button">
            swrGetCache read
          </button>
          <button onClick={parseSerializedKey} type="button">
            extractSWRKey parse
          </button>
          <button onClick={inspectConfigCache} type="button">
            inspect app-config cache
          </button>
        </div>
      </div>

      <p className="muted">{statusMessage}</p>

      <h3>todos cache (swrGetCache)</h3>
      <pre>{cacheValue}</pre>

      <h3>Serialized todos-summary key</h3>
      <pre>{serializedKey || "(click extractSWRKey parse)"}</pre>

      <h3>extractSWRKey output</h3>
      <pre>{extractedKey}</pre>
    </section>
  );
}
