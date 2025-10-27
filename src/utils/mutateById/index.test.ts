import { mutate } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mutateById } from "./index";

vi.mock("swr", () => ({
  mutate: vi.fn(() => Promise.resolve()),
}));

describe("mutateById", () => {
  beforeEach(() => {
    (mutate as any).mockClear();
  });

  it("should call global mutate with a filter for a single ID", async () => {
    await mutateById("user-1", { name: "test" });

    const filter = (mutate as any).mock.calls[0][0];

    expect(filter({ id: "user-1" })).toBe(true);
    expect(filter({ id: "user-2" })).toBe(false);
    expect(filter("some-other-key")).toBe(false);
  });

  it("should call global mutate with a filter for multiple IDs", async () => {
    await mutateById(["user-1", "user-2"], { name: "test" });

    const filter = (mutate as any).mock.calls[0][0];

    expect(filter({ id: "user-1" })).toBe(true);
    expect(filter({ id: "user-2" })).toBe(true);
    expect(filter({ id: "user-3" })).toBe(false);
  });

  it("should pass newData and revalidate options to global mutate", async () => {
    const newData = { name: "new-data" };
    await mutateById("user-1", newData, { revalidate: false });

    const dataUpdater = (mutate as any).mock.calls[0][1];
    const options = (mutate as any).mock.calls[0][2];

    expect(dataUpdater()).toEqual(newData);
    expect(options.revalidate).toBe(false);
  });

  it("should set revalidate to true by default if no newData is provided", async () => {
    await mutateById("user-1");

    const options = (mutate as any).mock.calls[0][2];
    expect(options.revalidate).toBe(true);
  });

  it("should throw a descriptive error on failure", async () => {
    const originalError = new Error("SWR mutation failed");
    (mutate as any).mockRejectedValue(originalError);

    const ids = ["user-1", "user-2"];

    await expect(mutateById(ids, { name: "test" })).rejects.toThrow(
      `Failed to mutate cache by ID(s): ${ids.join(", ")}`
    );
  });
});
