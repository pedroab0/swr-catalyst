import { mutate } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetCache } from "./index";

vi.mock("swr", () => ({
  mutate: vi.fn(() => Promise.resolve()),
}));

describe("resetCache", () => {
  beforeEach(() => {
    (mutate as any).mockClear();
  });

  it("should clear all keys if no preservedKeys are provided", async () => {
    await resetCache();
    const filter = (mutate as any).mock.calls[0][0];

    expect(filter({ id: "any" })).toBe(true);
    expect(filter("any-string")).toBe(true);
  });

  it("should preserve a single key", async () => {
    await resetCache("user-1");
    const filter = (mutate as any).mock.calls[0][0];

    expect(filter({ id: "user-1" })).toBe(false);
    expect(filter({ id: "user-2" })).toBe(true);
  });

  it("should preserve an array of keys", async () => {
    await resetCache(["user-1", "user-2"]);
    const filter = (mutate as any).mock.calls[0][0];

    expect(filter({ id: "user-1" })).toBe(false);
    expect(filter({ id: "user-2" })).toBe(false);
    expect(filter({ id: "user-3" })).toBe(true);
  });

  it("should call mutate with undefined data and revalidate: false", async () => {
    await resetCache();

    const data = (mutate as any).mock.calls[0][1];
    const revalidate = (mutate as any).mock.calls[0][2];

    expect(data).toBeUndefined();
    expect(revalidate).toBe(false);
  });
});
