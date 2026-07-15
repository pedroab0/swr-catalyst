import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

const mockTodos = [
  { completed: false, id: 1, title: "Test Todo 1" },
  { completed: true, id: 2, title: "Test Todo 2" },
];

let todosData = [...mockTodos];
let nextId = 3;

export const handlers = [
  http.get("/api/todos", () => HttpResponse.json(todosData)),

  http.get("/api/todos/:id", ({ params }) => {
    const id = Number(params.id);
    const todo = todosData.find((t) => t.id === id);

    if (!todo) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(todo);
  }),

  http.post("/api/todos", async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      completed?: boolean;
    };

    const newTodo = {
      completed: body.completed ?? false,
      id: nextId,
      title: body.title,
    };

    nextId += 1;

    todosData.push(newTodo);

    return HttpResponse.json(newTodo, { status: 201 });
  }),

  http.patch("/api/todos/:id", async ({ params, request }) => {
    const id = Number(params.id);

    const body = (await request.json()) as Partial<{
      title: string;
      completed: boolean;
    }>;

    const todoIndex = todosData.findIndex((t) => t.id === id);

    if (todoIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    todosData[todoIndex] = { ...todosData[todoIndex], ...body };

    return HttpResponse.json(todosData[todoIndex]);
  }),

  http.delete("/api/todos/:id", ({ params }) => {
    const id = Number(params.id);
    const todoIndex = todosData.findIndex((t) => t.id === id);

    if (todoIndex === -1) {
      return new HttpResponse(null, { status: 404 });
    }

    todosData.splice(todoIndex, 1);

    return HttpResponse.json({ id, success: true });
  }),
];

export const server = setupServer(...handlers);

export function resetServerData() {
  todosData = [...mockTodos];
  nextId = 3;
}
