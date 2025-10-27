import { describe, expect, it } from "vitest";

import type { SWRKey } from "@/types";

import { extractSWRKey } from "./index";

describe("extractSWRKey", () => {
  it("should return the same object if it is a valid SWRKey object", () => {
    const key: SWRKey = {
      id: "user-1",
      group: "users",
      data: { name: "John" },
    };
    expect(extractSWRKey(key)).toBe(key);
  });

  it("should extract data from a serialized SWRKey string", () => {
    const keyString = '#id:"user-1",group:"users",data:"some-data"';
    const expected = { id: "user-1", group: "users", data: "some-data" };
    expect(extractSWRKey(keyString)).toEqual(expected);
  });

  it("should handle serialized string with missing parts", () => {
    const keyString = '#id:"user-1"';
    const expected = { id: "user-1", group: undefined, data: undefined };
    expect(extractSWRKey(keyString)).toEqual(expected);
  });

  it("should return null for a simple string that does not match", () => {
    const key = "simple-key";
    expect(extractSWRKey(key)).toBeNull();
  });

  it("should return null for a non-SWRKey object", () => {
    const key = { name: "John" };
    expect(extractSWRKey(key)).toBeNull();
  });
});
