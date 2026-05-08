import { describe, expect, it } from "vitest";

import { deepEqual } from "./index";

describe("deepEqual", () => {
  it("returns true for identical references", () => {
    const obj = { a: 1 };
    expect(deepEqual(obj, obj)).toBe(true);
  });

  it("returns true for deeply equal objects", () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
  });

  it("returns false for different objects", () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it("handles null and undefined correctly", () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual({ a: 1 }, null)).toBe(false);
  });

  it("returns false for different types", () => {
    expect(deepEqual({ a: 1 }, "string")).toBe(false);
  });

  it("handles non-serializable values by returning false on error", () => {
    const circular: any = { a: 1 };
    circular.self = circular;
    expect(deepEqual(circular, { a: 1 })).toBe(false);
  });
});
