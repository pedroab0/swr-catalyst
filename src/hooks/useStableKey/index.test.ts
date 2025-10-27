import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useStableKey } from ".";

describe("useStableKey", () => {
  it("returns the same key reference when dependencies do not change", () => {
    const { result, rerender } = renderHook(
      ({ id, group, data }) => useStableKey({ id, group, data }),
      {
        initialProps: { id: "test", group: "test", data: "test" },
      }
    );

    const firstResult = result.current;
    rerender({ id: "test", group: "test", data: "test" });
    expect(result.current).toBe(firstResult);
  });

  it("returns a new key reference when dependencies change", () => {
    const { result, rerender } = renderHook(
      ({ id, group, data }) => useStableKey({ id, group, data }),
      {
        initialProps: { id: "test", group: "test", data: "test" },
      }
    );

    const firstResult = result.current;
    rerender({ id: "test", group: "test", data: "new-data" });
    expect(result.current).not.toBe(firstResult);
  });

  it("returns null when key is null", () => {
    const { result } = renderHook(() => useStableKey(null));
    expect(result.current).toBeNull();
  });

  it("returns null when id is missing", () => {
    const { result } = renderHook(() =>
      useStableKey({ id: "", data: "test" } as any)
    );
    expect(result.current).toBeNull();
  });

  it("returns null when data is missing", () => {
    const { result } = renderHook(() =>
      useStableKey({ id: "test", data: "" } as any)
    );
    expect(result.current).toBeNull();
  });

  it("maintains stable reference when group changes from undefined to undefined", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ id, data }),
      {
        initialProps: { id: "test", data: "test" },
      }
    );

    const firstResult = result.current;
    rerender({ id: "test", data: "test" });
    expect(result.current).toBe(firstResult);
    expect(result.current).toEqual({ id: "test", data: "test" });
  });

  it("maintains stable reference when data object values are equal", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ id, data }),
      {
        initialProps: { id: "test", data: { url: "/api/todos", userId: 1 } },
      }
    );

    const firstResult = result.current;
    rerender({ id: "test", data: { url: "/api/todos", userId: 1 } });

    expect(result.current).toBe(firstResult);
  });

  it("maintains stable reference when data object has same reference", () => {
    const stableData = { url: "/api/todos", userId: 1 };

    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ id, data }),
      {
        initialProps: { id: "test", data: stableData },
      }
    );

    const firstResult = result.current;

    rerender({ id: "test", data: stableData });

    expect(result.current).toBe(firstResult);
  });

  it("handles deeply nested objects with same values", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ id, data }),
      {
        initialProps: {
          id: "test",
          data: {
            name: "Pedro",
            apiData: {
              url: "apiUrl",
              payload: { user: { name: "Pedro", age: 25 } },
            },
          },
        },
      }
    );

    const firstResult = result.current;

    rerender({
      id: "test",
      data: {
        name: "Pedro",
        apiData: {
          url: "apiUrl",
          payload: { user: { name: "Pedro", age: 25 } },
        },
      },
    });

    expect(result.current).toBe(firstResult);
  });

  it("detects changes in deeply nested objects", () => {
    const { result, rerender } = renderHook(
      ({ id, data }) => useStableKey({ id, data }),
      {
        initialProps: {
          id: "test",
          data: {
            name: "Pedro",
            apiData: {
              url: "apiUrl",
              payload: { user: { name: "Pedro", age: 30 } },
            },
          },
        },
      }
    );

    const firstResult = result.current;

    rerender({
      id: "test",
      data: {
        name: "Pedro",
        apiData: {
          url: "apiUrl",
          payload: { user: { name: "Pedro", age: 31 } },
        },
      },
    });

    expect(result.current).not.toBe(firstResult);
  });
});
