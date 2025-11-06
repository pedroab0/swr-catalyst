import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SWRKey } from "@/types";

import { MutationError } from "./index";

describe("MutationError", () => {
  const testKey: SWRKey = { id: "todos", data: "/api/todos" };
  const timestamp = Date.now();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create error with all properties", () => {
      const originalError = new Error("Network failed");
      const context = {
        operation: "create" as const,
        key: testKey,
        data: { title: "New todo" },
        timestamp,
      };

      const error = new MutationError(
        "Failed to create resource",
        context,
        originalError
      );

      expect(error.name).toBe("MutationError");
      expect(error.message).toBe("Failed to create resource");
      expect(error.context).toEqual(context);
      expect(error.originalError).toBe(originalError);
      expect(error.stack).toBeDefined();
    });

    it("should handle non-Error originalError", () => {
      const context = {
        operation: "update" as const,
        key: testKey,
        timestamp,
      };

      const error = new MutationError("Failed", context, "string error");

      expect(error.originalError).toBe("string error");
    });

    it("should capture stack trace when available", () => {
      const error = new MutationError(
        "Test error",
        { operation: "delete", key: testKey, timestamp },
        new Error("Original")
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("MutationError");
    });
  });

  describe("getUserMessage", () => {
    it("should return user-friendly message for create operation", () => {
      const error = new MutationError(
        "Technical error",
        { operation: "create", key: testKey, timestamp },
        new Error("Test error")
      );

      expect(error.getUserMessage()).toBe(
        "Failed to add todos. Please try again."
      );
    });

    it("should return user-friendly message for update operation", () => {
      const error = new MutationError(
        "Technical error",
        { operation: "update", key: testKey, timestamp },
        new Error("Test error")
      );

      expect(error.getUserMessage()).toBe(
        "Failed to update todos. Please try again."
      );
    });

    it("should return user-friendly message for delete operation", () => {
      const error = new MutationError(
        "Technical error",
        { operation: "delete", key: testKey, timestamp },
        new Error("Test error")
      );

      expect(error.getUserMessage()).toBe(
        "Failed to delete todos. Please try again."
      );
    });

    it("should handle missing key id", () => {
      const error = new MutationError(
        "Technical error",
        { operation: "create", key: null, timestamp },
        new Error("Test error")
      );

      expect(error.getUserMessage()).toBe(
        "Failed to add resource. Please try again."
      );
    });

    it("should handle key without id", () => {
      const error = new MutationError(
        "Technical error",
        { operation: "update", key: { id: "", data: "/api" }, timestamp },
        new Error("Test error")
      );

      expect(error.getUserMessage()).toBe(
        "Failed to update resource. Please try again."
      );
    });
  });

  describe("toJSON", () => {
    it("should serialize error with Error originalError", () => {
      const originalError = new Error("Network failed");
      originalError.stack = "Error stack trace";

      const error = new MutationError(
        "Failed to create",
        {
          operation: "create",
          key: testKey,
          data: { title: "New" },
          timestamp,
        },
        originalError
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: "MutationError",
        message: "Failed to create",
        context: {
          operation: "create",
          key: testKey,
          data: { title: "New" },
          timestamp,
        },
        originalError: {
          name: "Error",
          message: "Network failed",
          stack: "Error stack trace",
        },
        stack: error.stack,
      });
    });

    it("should serialize error with non-Error originalError", () => {
      const error = new MutationError(
        "Failed to update",
        { operation: "update", key: testKey, timestamp },
        "string error"
      );

      const json = error.toJSON();

      expect(json.originalError).toBe("string error");
    });

    it("should serialize error with number originalError", () => {
      const errorCode = 404;
      const error = new MutationError(
        "Failed",
        { operation: "delete", key: testKey, timestamp },
        errorCode
      );

      const json = error.toJSON();

      expect(json.originalError).toBe("404");
    });

    it("should serialize error with object originalError", () => {
      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        { code: "ERR_001" }
      );

      const json = error.toJSON();

      expect(json.originalError).toBe("[object Object]");
    });
  });

  describe("isNetworkError", () => {
    it("should return true for NetworkError", () => {
      const originalError = new Error("Connection lost");
      originalError.name = "NetworkError";

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isNetworkError()).toBe(true);
    });

    it("should return true for fetch error", () => {
      const originalError = new Error("fetch failed");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isNetworkError()).toBe(true);
    });

    it("should return true for network error in message", () => {
      const originalError = new Error("Network connection failed");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isNetworkError()).toBe(true);
    });

    it("should return true for timeout error", () => {
      const originalError = new Error("Request timeout");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isNetworkError()).toBe(true);
    });

    it("should return false for non-network errors", () => {
      const originalError = new Error("Validation failed");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isNetworkError()).toBe(false);
    });

    it("should return false for non-Error originalError", () => {
      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        "string error"
      );

      expect(error.isNetworkError()).toBe(false);
    });

    it("should be case insensitive", () => {
      const originalError = new Error("FETCH FAILED");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isNetworkError()).toBe(true);
    });
  });

  describe("isValidationError", () => {
    it("should return true for validation error", () => {
      const originalError = new Error("Validation failed");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isValidationError()).toBe(true);
    });

    it("should return true for invalid error", () => {
      const originalError = new Error("Invalid input");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isValidationError()).toBe(true);
    });

    it("should return true for required field error", () => {
      const originalError = new Error("Title is required");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isValidationError()).toBe(true);
    });

    it("should return false for non-validation errors", () => {
      const originalError = new Error("Network failed");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isValidationError()).toBe(false);
    });

    it("should return false for non-Error originalError", () => {
      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        "string error"
      );

      expect(error.isValidationError()).toBe(false);
    });

    it("should be case insensitive", () => {
      const originalError = new Error("VALIDATION ERROR");

      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        originalError
      );

      expect(error.isValidationError()).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle error with all context fields", () => {
      const testId = 123;
      const error = new MutationError(
        "Failed",
        {
          operation: "update",
          key: testKey,
          data: { title: "Updated" },
          id: testId,
          timestamp,
        },
        new Error("Original")
      );

      expect(error.context.id).toBe(testId);
      expect(error.context.data).toEqual({ title: "Updated" });
    });

    it("should handle error with minimal context", () => {
      const testId = 123;
      const error = new MutationError(
        "Failed",
        {
          operation: "update",
          key: testKey,
          timestamp,
          id: testId,
          data: { title: "Updated" },
        },
        new Error("Update failed")
      );

      expect(error.context.id).toBe(testId);
      expect(error.context.data).toEqual({ title: "Updated" });
    });

    it("should handle error with minimal context", () => {
      const error = new MutationError(
        "Failed",
        { operation: "delete", key: testKey, timestamp },
        new Error("Test error")
      );

      expect(error.context.data).toBeUndefined();
      expect(error.context.id).toBeUndefined();
    });

    it("should handle null originalError", () => {
      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        null
      );

      expect(error.originalError).toBeNull();
      expect(error.isNetworkError()).toBe(false);
      expect(error.isValidationError()).toBe(false);
    });

    it("should handle undefined originalError", () => {
      const error = new MutationError(
        "Failed",
        { operation: "create", key: testKey, timestamp },
        undefined
      );

      expect(error.originalError).toBeUndefined();
      expect(error.isNetworkError()).toBe(false);
      expect(error.isValidationError()).toBe(false);
    });
  });
});
