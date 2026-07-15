import { waitFor } from "@testing-library/react";
import useSWR from "swr";
import { describe, expect, it } from "vitest";

import { fetchTodos, renderHookWithSWR } from "../helpers";

describe("Basic Integration Test Setup", () => {
  it("should fetch data from MSW server", async () => {
    const { result } = renderHookWithSWR(() =>
      useSWR("/api/todos", fetchTodos)
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    expect(result.current.data).toHaveLength(2);

    expect(result.current.data?.[0]).toHaveProperty("id");
    expect(result.current.data?.[0]).toHaveProperty("title");

    expect(result.current.error).toBeUndefined();
  });

  it("should handle MSW POST requests", async () => {
    const response = await fetch("/api/todos", {
      body: JSON.stringify({ completed: false, title: "Test Todo" }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    expect(response.ok).toBe(true);

    const data = await response.json();

    expect(data).toHaveProperty("id");

    expect(data.title).toBe("Test Todo");
  });
});
