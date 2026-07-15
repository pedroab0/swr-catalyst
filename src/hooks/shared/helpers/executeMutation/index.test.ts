import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SWRKey } from "@/types";

import { MutationError } from "@/errors";

import { executeMutation } from "./index";

const mutate = vi.fn();

describe("executeMutation", () => {
  const testKey: SWRKey = { data: "/api/todos", id: "todos" };

  beforeEach(() => {
    vi.clearAllMocks();
    mutate.mockResolvedValue(undefined);
  });

  describe("successful execution", () => {
    it("should execute mutation and revalidate cache", async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 1, title: "New" });
      const onError = vi.fn();

      const result = await executeMutation(mutationFn, {
        mutate,
        onError,
        shouldRollback: false,
        stableKey: testKey,
      });

      expect(result).toEqual({ id: 1, title: "New" });
      expect(mutationFn).toHaveBeenCalledTimes(1);
      expect(mutate).toHaveBeenCalledWith(testKey, undefined, undefined);
      expect(onError).not.toHaveBeenCalled();
    });

    it("should return mutation result", async () => {
      const expectedResult = { data: { id: 123 }, success: true };
      const mutationFn = vi.fn().mockResolvedValue(expectedResult);
      const onError = vi.fn();

      const result = await executeMutation(mutationFn, {
        mutate,
        onError,
        shouldRollback: false,
        stableKey: testKey,
      });

      expect(result).toBe(expectedResult);
    });

    it("should not call onError on success", async () => {
      const mutationFn = vi.fn().mockResolvedValue({ id: 1 });
      const onError = vi.fn();

      await executeMutation(mutationFn, {
        mutate,
        onError,
        shouldRollback: false,
        stableKey: testKey,
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should call onError and rethrow on failure", async () => {
      const error = new MutationError(
        "Failed",
        { key: testKey, operation: "create", timestamp: Date.now() },
        new Error("Original")
      );
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      await expect(
        executeMutation(mutationFn, {
          mutate,
          onError,
          shouldRollback: false,
          stableKey: testKey,
        })
      ).rejects.toThrow(error);

      expect(onError).toHaveBeenCalledWith(error);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should not revalidate cache on error", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          shouldRollback: false,
          stableKey: testKey,
        });
      } catch {
        // ignore
      }

      expect(mutate).not.toHaveBeenCalled();
    });
  });

  describe("rollback handling", () => {
    it("should rollback when shouldRollback is true and originalData exists", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      const originalData = [{ id: 1, title: "Original" }];

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          originalData,
          shouldRollback: true,
          stableKey: testKey,
        });
      } catch {
        // ignore
      }

      expect(mutate).toHaveBeenCalledWith(testKey, originalData, false);
      expect(onError).toHaveBeenCalled();
    });

    it("should not rollback when shouldRollback is false", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();
      const originalData = [{ id: 1, title: "Original" }];

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          originalData,
          shouldRollback: false,
          stableKey: testKey,
        });
      } catch {
        // ignore
      }

      expect(mutate).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it("should not rollback when originalData is undefined", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          originalData: undefined,
          shouldRollback: true,
          stableKey: testKey,
        });
      } catch {
        // ignore
      }

      expect(mutate).not.toHaveBeenCalled();
    });

    it("should rollback with null originalData when shouldRollback is true", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          originalData: null,
          shouldRollback: true,
          stableKey: testKey,
        });
      } catch {
        // ignore
      }

      expect(mutate).toHaveBeenCalledWith(testKey, null, false);
    });

    it("should rollback with empty array when shouldRollback is true", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          originalData: [],
          shouldRollback: true,
          stableKey: testKey,
        });
      } catch {
        // ignore
      }

      expect(mutate).toHaveBeenCalledWith(testKey, [], false);
    });
  });

  describe("execution order", () => {
    it("should call onError before rethrowing", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const callOrder: string[] = [];
      const onError = vi.fn(() => callOrder.push("onError"));

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          shouldRollback: false,
          stableKey: testKey,
        });
      } catch {
        callOrder.push("catch");
      }

      expect(callOrder).toEqual(["onError", "catch"]);
    });

    it("should rollback before calling onError", async () => {
      const error = new Error("Failed");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const callOrder: string[] = [];
      const onError = vi.fn(() => callOrder.push("onError"));
      mutate.mockImplementation(() => {
        callOrder.push("rollback");
        return Promise.resolve();
      });

      try {
        await executeMutation(mutationFn, {
          mutate,
          onError,
          originalData: [],
          shouldRollback: true,
          stableKey: testKey,
        });
      } catch {
        callOrder.push("catch");
      }

      expect(callOrder).toEqual(["rollback", "onError", "catch"]);
    });
  });

  describe("edge cases", () => {
    it("should handle mutation returning undefined", async () => {
      const mutationFn = vi.fn().mockResolvedValue(undefined);
      const onError = vi.fn();

      const result = await executeMutation(mutationFn, {
        mutate,
        onError,
        shouldRollback: false,
        stableKey: testKey,
      });

      expect(result).toBeUndefined();
      expect(mutate).toHaveBeenCalled();
    });

    it("should handle mutation returning null", async () => {
      const mutationFn = vi.fn().mockResolvedValue(null);
      const onError = vi.fn();

      const result = await executeMutation(mutationFn, {
        mutate,
        onError,
        shouldRollback: false,
        stableKey: testKey,
      });

      expect(result).toBeNull();
    });

    it("should handle complex return types", async () => {
      const complexResult = {
        data: { id: 1, nested: { value: "test" } },
        meta: { timestamp: Date.now() },
      };
      const mutationFn = vi.fn().mockResolvedValue(complexResult);
      const onError = vi.fn();

      const result = await executeMutation(mutationFn, {
        mutate,
        onError,
        shouldRollback: false,
        stableKey: testKey,
      });

      expect(result).toEqual(complexResult);
    });

    it("should handle non-MutationError errors", async () => {
      const error = new TypeError("Type error");
      const mutationFn = vi.fn().mockRejectedValue(error);
      const onError = vi.fn();

      await expect(
        executeMutation(mutationFn, {
          mutate,
          onError,
          shouldRollback: false,
          stableKey: testKey,
        })
      ).rejects.toThrow(TypeError);

      expect(onError).toHaveBeenCalledWith(error);
    });
  });
});
