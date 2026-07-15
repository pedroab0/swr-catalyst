import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useStableKey } from ".";

describe("useStableKey", () => {
  it("returns the same key reference when dependencies do not change", () => {
    const { result, rerender } = renderHook(
      ({ id, group, data }) => useStableKey({ data, group, id }),
      {
        initialProps: { data: "test", group: "test", id: "test" },
      }
    );

    const firstResult = result.current;
    rerender({ data: "test", group: "test", id: "test" });
    expect(result.current).toBe(firstResult);
  });

  it("returns a new key reference when dependencies change", () => {
    const { result, rerender } = renderHook(
      ({ id, group, data }) => useStableKey({ data, group, id }),
      {
        initialProps: { data: "test", group: "test", id: "test" },
      }
    );

    const firstResult = result.current;
    rerender({ data: "new-data", group: "test", id: "test" });
    expect(result.current).not.toBe(firstResult);
  });

  it("returns null when key is null", () => {
    const { result } = renderHook(() => useStableKey(null));
    expect(result.current).toBeNull();
  });

  it("returns null when id is missing", () => {
    const { result } = renderHook(() =>
      useStableKey({ data: "test", id: "" } as any)
    );
    expect(result.current).toBeNull();
  });

  it("returns null when data is missing", () => {
    const { result } = renderHook(() =>
      useStableKey({ data: "", id: "test" } as any)
    );
    expect(result.current).toBeNull();
  });

  it("maintains stable reference when group changes from undefined to undefined", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ data, id }),
      {
        initialProps: { data: "test", id: "test" },
      }
    );

    const firstResult = result.current;
    rerender({ data: "test", id: "test" });
    expect(result.current).toBe(firstResult);
    expect(result.current).toEqual({ data: "test", id: "test" });
  });

  it("maintains stable reference when data object values are equal", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ data, id }),
      {
        initialProps: { data: { url: "/api/todos", userId: 1 }, id: "test" },
      }
    );

    const firstResult = result.current;
    rerender({ data: { url: "/api/todos", userId: 1 }, id: "test" });

    expect(result.current).toBe(firstResult);
  });

  it("maintains stable reference when data object has same reference", () => {
    const stableData = { url: "/api/todos", userId: 1 };

    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ data, id }),
      {
        initialProps: { data: stableData, id: "test" },
      }
    );

    const firstResult = result.current;

    rerender({ data: stableData, id: "test" });

    expect(result.current).toBe(firstResult);
  });

  it("handles deeply nested objects with same values", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ data, id }),
      {
        initialProps: {
          data: {
            apiData: {
              payload: { user: { age: 25, name: "Pedro" } },
              url: "apiUrl",
            },
            name: "Pedro",
          },
          id: "test",
        },
      }
    );

    const firstResult = result.current;

    rerender({
      data: {
        apiData: {
          payload: { user: { age: 25, name: "Pedro" } },
          url: "apiUrl",
        },
        name: "Pedro",
      },
      id: "test",
    });

    expect(result.current).toBe(firstResult);
  });

  it("detects changes in deeply nested objects", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ data, id }),
      {
        initialProps: {
          data: {
            apiData: {
              payload: { user: { age: 30, name: "Pedro" } },
              url: "apiUrl",
            },
            name: "Pedro",
          },
          id: "test",
        },
      }
    );

    const firstResult = result.current;

    rerender({
      data: {
        apiData: {
          payload: { user: { age: 31, name: "Pedro" } },
          url: "apiUrl",
        },
        name: "Pedro",
      },
      id: "test",
    });

    expect(result.current).not.toBe(firstResult);
  });
});
