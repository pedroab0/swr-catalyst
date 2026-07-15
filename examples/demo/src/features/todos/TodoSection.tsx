import {
  createTodoApi,
  deleteTodoApi,
  fetchTodos,
  fetchTodosSummary,
  updateTodoApi,
} from "@demo/api/fetchers";
import { useCacheSnapshots } from "@demo/features/cache/useCacheSnapshots";
import { todosKey, todosSummaryKey } from "@demo/keys";
import type { DemoEventInput, Todo, TodoInput, TodoUpdate } from "@demo/types";
import { type SyntheticEvent, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  MutationError,
  type SWRKey,
  to,
  useSWRCreate,
  useSWRDelete,
  useSWRUpdate,
} from "swr-catalyst";

type TodoSectionEventInput = Omit<DemoEventInput, "dataMode" | "scenario">;

type TodoSectionProps = {
  onActionEvent: (event: TodoSectionEventInput) => void;
  onMutationError: (error: unknown) => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof MutationError) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

export function TodoSection({
  onActionEvent,
  onMutationError,
}: TodoSectionProps) {
  const [newTitle, setNewTitle] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeUpdateTodoId, setActiveUpdateTodoId] = useState<number | null>(
    null
  );
  const [activeDeleteTodoId, setActiveDeleteTodoId] = useState<number | null>(
    null
  );
  const [lastAction, setLastAction] = useState("No hook action executed yet.");

  const { mutate } = useSWRConfig();
  const { takeSnapshot, createDiff } = useCacheSnapshots();

  const {
    data: todos = [],
    isLoading,
    error: fetchError,
  } = useSWR<Todo[]>(todosKey, fetchTodos);

  // useSWRCreate currently ties key `data` generic to mutation payload type.
  // Cast keeps strong payload typing in the demo without changing library types.
  const createKey = todosKey as unknown as SWRKey<TodoInput>;

  const createMutation = useSWRCreate<TodoInput, Todo[]>(
    createKey,
    createTodoApi,
    {
      optimisticUpdate: (currentTodos, input) => [
        ...(currentTodos ?? []),
        {
          completed: Boolean(input.completed),
          id: Date.now(),
          optimistic: true,
          title: input.title,
        },
      ],
      rollbackOnError: true,
    }
  );

  const updateMutation = useSWRUpdate<TodoUpdate, Todo[]>(
    todosKey,
    updateTodoApi,
    {
      optimisticUpdate: (currentTodos, payload) =>
        (currentTodos ?? []).map((todo) =>
          todo.id === payload.id ? { ...todo, ...payload.data } : todo
        ),
      rollbackOnError: true,
    }
  );

  const deleteMutation = useSWRDelete<Todo[]>(todosKey, deleteTodoApi, {
    optimisticUpdate: (currentTodos, id) =>
      (currentTodos ?? []).filter((todo) => todo.id !== id),
    rollbackOnError: true,
  });

  async function syncTodosCache() {
    const [todosResult, todosError] = await to(fetchTodos());
    if (todosError || !todosResult) {
      throw todosError ?? new Error("Failed to refresh todos cache.");
    }

    const [summaryResult, summaryError] = await to(fetchTodosSummary());
    if (summaryError || !summaryResult) {
      throw summaryError ?? new Error("Failed to refresh summary cache.");
    }

    await mutate(todosKey, todosResult, { revalidate: false });
    await mutate(todosSummaryKey, summaryResult, { revalidate: false });
  }

  async function runTrackedHookAction<TResult>(params: {
    action: string;
    payloadSummary?: string;
    execute: () => Promise<TResult>;
    resultSummary: (result: TResult) => string;
    replayable?: boolean;
    replayAction?: () => Promise<void>;
  }) {
    const before = takeSnapshot();

    try {
      const result = await params.execute();
      const after = takeSnapshot();

      const nextActionMessage = `${params.action} succeeded.`;
      setLastAction(nextActionMessage);

      onActionEvent({
        action: params.action,
        cacheDiff: createDiff(before, after),
        category: "hooks",
        keyRefs: ["todos", "todos-summary"],
        payloadSummary: params.payloadSummary,
        replayAction: params.replayAction,
        replayable: Boolean(params.replayable),
        resultSummary: params.resultSummary(result),
        status: "success",
      });

      return result;
    } catch (error) {
      const after = takeSnapshot();
      const errorMessage = getErrorMessage(error);

      setLastAction(`${params.action} failed: ${errorMessage}`);
      onMutationError(error);
      onActionEvent({
        action: params.action,
        cacheDiff: createDiff(before, after),
        category: "hooks",
        errorSummary: errorMessage,
        keyRefs: ["todos", "todos-summary"],
        payloadSummary: params.payloadSummary,
        status: "error",
      });

      return null;
    }
  }

  async function createTodoFromTitle(title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const created = await runTrackedHookAction({
      action: "Create todo",
      execute: async () => {
        const createdTodo = await createMutation.trigger({
          completed: false,
          title: trimmedTitle,
        });
        await syncTodosCache();
        setNewTitle("");
        return createdTodo;
      },
      payloadSummary: `title=${JSON.stringify(trimmedTitle)}`,
      replayAction: async () => {
        await createTodoFromTitle(trimmedTitle);
      },
      replayable: true,
      resultSummary: () => `Created title=${JSON.stringify(trimmedTitle)}.`,
    });

    if (created) {
      setLastAction(`Created "${trimmedTitle}".`);
    }
  }

  async function toggleTodo(todo: Todo) {
    setActiveUpdateTodoId(todo.id);

    try {
      const updated = await runTrackedHookAction({
        action: "Toggle todo",
        execute: async () => {
          const updatedTodo = await updateMutation.trigger(todo.id, {
            completed: !todo.completed,
          });
          await syncTodosCache();
          return updatedTodo;
        },
        payloadSummary: `id=${todo.id}, completed=${String(!todo.completed)}`,
        replayAction: async () => {
          await toggleTodo(todo);
        },
        replayable: true,
        resultSummary: () =>
          `Todo ${todo.id} completed toggled to ${String(!todo.completed)}.`,
      });

      if (updated) {
        setLastAction(`Toggled "${todo.title}".`);
      }
    } finally {
      setActiveUpdateTodoId(null);
    }
  }

  function startRename(todo: Todo) {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
  }

  function cancelRename() {
    setEditingTodoId(null);
    setEditingTitle("");
  }

  async function saveRename(todo: Todo) {
    const nextTitle = editingTitle.trim();
    if (!nextTitle || nextTitle === todo.title) {
      cancelRename();
      return;
    }

    setActiveUpdateTodoId(todo.id);

    try {
      const updated = await runTrackedHookAction({
        action: "Rename todo",
        execute: async () => {
          const updatedTodo = await updateMutation.trigger(todo.id, {
            title: nextTitle,
          });
          await syncTodosCache();
          return updatedTodo;
        },
        payloadSummary: `id=${todo.id}, title=${JSON.stringify(nextTitle)}`,
        resultSummary: () =>
          `Todo ${todo.id} renamed to ${JSON.stringify(nextTitle)}.`,
      });

      if (updated) {
        cancelRename();
        setLastAction(`Renamed item to "${nextTitle}".`);
      }
    } finally {
      setActiveUpdateTodoId(null);
    }
  }

  async function deleteTodoById(id: number) {
    setActiveDeleteTodoId(id);

    try {
      const deleted = await runTrackedHookAction({
        action: "Delete todo",
        execute: async () => {
          const deletedResult = await deleteMutation.trigger(id);
          await syncTodosCache();
          return deletedResult;
        },
        payloadSummary: `id=${id}`,
        resultSummary: () => `Deleted id=${id}`,
      });

      if (deleted) {
        setLastAction(`Deleted item #${id}.`);
      }
    } finally {
      setActiveDeleteTodoId(null);
    }
  }

  async function handleCreate(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    await createTodoFromTitle(newTitle);
  }

  const latestMutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  return (
    <section className="panel">
      <h2>Hooks Demo: useSWRCreate / useSWRUpdate / useSWRDelete</h2>
      <p className="muted">
        In-screen guide: create a todo, rename it, toggle completion, then
        delete it. Increase delay to visualize optimistic and loading states.
      </p>
      <ul className="commentList">
        <li>
          Uses <code>to()</code> to capture tuple-style fetch refresh results.
        </li>
        <li>
          Optimistic entries are marked with <code>(optimistic)</code>.
        </li>
        <li>Each action emits timeline metadata and cache diff details.</li>
        <li>{lastAction}</li>
      </ul>

      <dl className="detailsList compact">
        <div>
          <dt>create isMutating</dt>
          <dd>{createMutation.isMutating ? "true" : "false"}</dd>
        </div>
        <div>
          <dt>update isMutating</dt>
          <dd>{updateMutation.isMutating ? "true" : "false"}</dd>
        </div>
        <div>
          <dt>delete isMutating</dt>
          <dd>{deleteMutation.isMutating ? "true" : "false"}</dd>
        </div>
      </dl>

      <form className="row" onSubmit={handleCreate}>
        <input
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Create a todo"
          value={newTitle}
        />
        <button disabled={createMutation.isMutating} type="submit">
          {createMutation.isMutating ? "Creating..." : "Create"}
        </button>
      </form>

      {isLoading ? <p className="muted">Loading todos...</p> : null}
      {fetchError ? (
        <p className="error">Fetch error: {getErrorMessage(fetchError)}</p>
      ) : null}
      {latestMutationError ? (
        <p className="error">
          Mutation error: {getErrorMessage(latestMutationError)}
        </p>
      ) : null}

      <ul className="todoList">
        {todos.map((todo) => {
          const isUpdatingThisTodo =
            updateMutation.isMutating && activeUpdateTodoId === todo.id;
          const isDeletingThisTodo =
            deleteMutation.isMutating && activeDeleteTodoId === todo.id;

          return (
            <li className={todo.optimistic ? "optimistic" : ""} key={todo.id}>
              <label className="todoLabel">
                <input
                  checked={todo.completed}
                  disabled={
                    updateMutation.isMutating || deleteMutation.isMutating
                  }
                  onChange={async () => {
                    await toggleTodo(todo);
                  }}
                  type="checkbox"
                />
                <span>
                  {todo.title}
                  {todo.optimistic ? " (optimistic)" : ""}
                </span>
              </label>

              <div className="row">
                {isUpdatingThisTodo ? (
                  <span className="badge">Saving...</span>
                ) : null}
                {isDeletingThisTodo ? (
                  <span className="badge">Deleting...</span>
                ) : null}

                {editingTodoId === todo.id ? (
                  <>
                    <input
                      disabled={updateMutation.isMutating}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      value={editingTitle}
                    />
                    <button
                      disabled={updateMutation.isMutating}
                      onClick={async () => {
                        await saveRename(todo);
                      }}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      disabled={updateMutation.isMutating}
                      onClick={cancelRename}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={
                        updateMutation.isMutating || deleteMutation.isMutating
                      }
                      onClick={() => startRename(todo)}
                      type="button"
                    >
                      Rename
                    </button>
                    <button
                      className="danger"
                      disabled={
                        deleteMutation.isMutating || updateMutation.isMutating
                      }
                      onClick={async () => {
                        await deleteTodoById(todo.id);
                      }}
                      type="button"
                    >
                      {isDeletingThisTodo ? "Deleting..." : "Delete"}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
