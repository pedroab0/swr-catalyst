import type {
  AppConfig,
  Todo,
  TodoInput,
  TodosSummary,
  TodoUpdate,
} from "@demo/types";

const initialTodos: Todo[] = [
  { id: 1, title: "Document API behavior", completed: false },
  { id: 2, title: "Ship optimistic updates", completed: true },
  { id: 3, title: "Review integration tests", completed: false },
];

const appConfig: AppConfig = {
  name: "swr-catalyst demo",
  version: "0.1.0",
  environment: "mocked",
};

let todos = initialTodos.map((todo) => ({ ...todo }));
let nextId = 4;

function cloneTodo(todo: Todo): Todo {
  return { ...todo };
}

export function getTodos(): Todo[] {
  return todos.map(cloneTodo);
}

export function getTodosSummary(): TodosSummary {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.completed).length;

  return {
    total,
    completed,
    pending: total - completed,
  };
}

export function getAppConfig(): AppConfig {
  return { ...appConfig };
}

export function createTodo(input: TodoInput): Todo {
  const todo: Todo = {
    id: nextId++,
    title: input.title.trim(),
    completed: Boolean(input.completed),
  };

  todos = [...todos, todo];
  return cloneTodo(todo);
}

export function updateTodo(id: number, update: TodoUpdate): Todo | null {
  const currentTodo = todos.find((todo) => todo.id === id);
  if (!currentTodo) {
    return null;
  }

  const updatedTodo: Todo = {
    ...currentTodo,
    ...update,
    title: update.title?.trim() ?? currentTodo.title,
  };

  todos = todos.map((todo) => (todo.id === id ? updatedTodo : todo));
  return cloneTodo(updatedTodo);
}

export function deleteTodo(id: number): { deletedId: number } | null {
  const exists = todos.some((todo) => todo.id === id);
  if (!exists) {
    return null;
  }

  todos = todos.filter((todo) => todo.id !== id);
  return { deletedId: id };
}

export function resetDemoData(): void {
  todos = initialTodos.map((todo) => ({ ...todo }));
  nextId = 4;
}
