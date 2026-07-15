import type {
  AppConfig,
  Todo,
  TodoInput,
  TodosSummary,
  TodoUpdate,
} from "@demo/types";

const initialTodos: Todo[] = [
  { completed: false, id: 1, title: "Document API behavior" },
  { completed: true, id: 2, title: "Ship optimistic updates" },
  { completed: false, id: 3, title: "Review integration tests" },
];

const appConfig: AppConfig = {
  environment: "mocked",
  name: "swr-catalyst demo",
  version: "0.1.0",
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
    completed,
    pending: total - completed,
    total,
  };
}

export function getAppConfig(): AppConfig {
  return { ...appConfig };
}

export function createTodo(input: TodoInput): Todo {
  const todo: Todo = {
    completed: Boolean(input.completed),
    id: nextId++,
    title: input.title.trim(),
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
