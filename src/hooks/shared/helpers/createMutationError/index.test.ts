import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";

import { createMutationError } from "./index";

describe("createMutationError", () => {
  const testKey: SWRKey = { id: "todos", data: "/api/todos" };

  describe("create operation", () => {
    it("should create error for create operation with data", () => {
      const originalError = new Error("Network failed");
      const error = createMutationError("create", testKey, originalError, {
        data: { title: "New todo" },
      });

      expect(error.name).toBe("MutationError");
      expect(error.message).toBe(
        'Failed to create resource "todos". Network failed'
      );
      expect(error.context.operation).toBe("create");
      expect(error.context.key).toBe(testKey);
      expect(error.context.data).toEqual({ title: "New todo" });
      expect(error.originalError).toBe(originalError);
    });

    it("should create error without additional context", () => {
      const originalError = new Error("Failed");
      const error = createMutationError("create", testKey, originalError);

      expect(error.message).toBe('Failed to create resource "todos". Failed');
      expect(error.context.data).toBeUndefined();
      expect(error.context.id).toBeUndefined();
    });
  });

  describe("update operation", () => {
    it("should create error for update operation with id", () => {
      const testId = 123;
      const originalError = new Error("Validation failed");
      const error = createMutationError("update", testKey, originalError, {
        data: { title: "Updated" },
        id: testId,
      });

      expect(error.message).toBe(
        `Failed to update resource "todos" with ID ${testId}. Validation failed`
      );
      expect(error.context.operation).toBe("update");
      expect(error.context.id).toBe(testId);
      expect(error.context.data).toEqual({ title: "Updated" });
    });

    it("should create error with string id", () => {
      const originalError = new Error("Not found");
      const error = createMutationError("update", testKey, originalError, {
        id: "abc-123",
      });

      expect(error.message).toBe(
        'Failed to update resource "todos" with ID abc-123. Not found'
      );
      expect(error.context.id).toBe("abc-123");
    });

    it("should create error without id", () => {
      const originalError = new Error("Failed");
      const error = createMutationError("update", testKey, originalError, {
        data: { title: "Updated" },
      });

      expect(error.message).toBe('Failed to update resource "todos". Failed');
      expect(error.context.id).toBeUndefined();
    });
  });

  describe("delete operation", () => {
    it("should create error for delete operation with id", () => {
      const testId = 456;
      const originalError = new Error("Not found");
      const error = createMutationError("delete", testKey, originalError, {
        id: testId,
      });

      expect(error.message).toBe(
        `Failed to delete resource "todos" with ID ${testId}. Not found`
      );
      expect(error.context.operation).toBe("delete");
      expect(error.context.id).toBe(testId);
    });

    it("should create error without id", () => {
      const originalError = new Error("Failed");
      const error = createMutationError("delete", testKey, originalError);

      expect(error.message).toBe('Failed to delete resource "todos". Failed');
    });
  });

  describe("error handling", () => {
    it("should handle non-Error originalError", () => {
      const error = createMutationError("create", testKey, "string error");

      expect(error.message).toBe(
        'Failed to create resource "todos". string error'
      );
      expect(error.originalError).toBe("string error");
    });

    it("should handle number originalError", () => {
      const errorCode = 404;
      const error = createMutationError("update", testKey, errorCode);

      expect(error.message).toBe(
        `Failed to update resource "todos". ${errorCode}`
      );
    });

    it("should handle object originalError", () => {
      const error = createMutationError("delete", testKey, {
        code: "ERR_001",
      });

      expect(error.message).toBe(
        'Failed to delete resource "todos". [object Object]'
      );
    });

    it("should handle null originalError", () => {
      const error = createMutationError("create", testKey, null);

      expect(error.message).toBe('Failed to create resource "todos". null');
    });
  });

  describe("key handling", () => {
    it("should use 'unknown' when key is null", () => {
      const originalError = new Error("Failed");
      const error = createMutationError("create", null, originalError);

      expect(error.message).toBe('Failed to create resource "unknown". Failed');
      expect(error.context.key).toBeNull();
    });

    it("should use empty string when key has no id", () => {
      const originalError = new Error("Failed");
      const keyWithoutId = { id: "", data: "/api" };
      const error = createMutationError("update", keyWithoutId, originalError);

      expect(error.message).toBe('Failed to update resource "unknown". Failed');
    });

    it("should extract id from key", () => {
      const originalError = new Error("Failed");
      const error = createMutationError("delete", testKey, originalError);

      expect(error.message).toContain('"todos"');
    });
  });

  describe("timestamp", () => {
    it("should add timestamp to context", () => {
      const beforeTime = Date.now();
      const error = createMutationError("create", testKey, new Error("Failed"));
      const afterTime = Date.now();

      expect(error.context.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(error.context.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe("context preservation", () => {
    it("should preserve all additional context fields", () => {
      const testId = 999;
      const error = createMutationError(
        "update",
        testKey,
        new Error("Test error"),
        {
          data: { title: "Test" },
          id: testId,
        }
      );

      expect(error.context.data).toEqual({ title: "Test" });
      expect(error.context.id).toBe(testId);
      expect(error.context.operation).toBe("update");
      expect(error.context.key).toBe(testKey);
      expect(error.context.timestamp).toBeDefined();
    });

    it("should handle empty additional context", () => {
      const error = createMutationError(
        "create",
        testKey,
        new Error("Test error"),
        {}
      );

      expect(error.context.data).toBeUndefined();
      expect(error.context.id).toBeUndefined();
    });
  });
});
