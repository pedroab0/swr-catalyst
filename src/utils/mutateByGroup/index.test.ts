import { mutate } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mutateByGroup } from "./index";

vi.mock("swr", () => ({
  mutate: vi.fn(() => Promise.resolve()),
}));

describe("mutateByGroup", () => {
  beforeEach(() => {
    (mutate as any).mockClear();
  });

  it("should call global mutate with a filter for a single group", async () => {
    await mutateByGroup("group-1", { name: "test" });

    const filter = (mutate as any).mock.calls[0][0];

    expect(filter({ id: "any", group: "group-1" })).toBe(true);
    expect(filter({ id: "any", group: "group-2" })).toBe(false);
    expect(filter({ id: "any" })).toBe(false);
  });

  it("should call global mutate with a filter for multiple groups", async () => {
    await mutateByGroup(["group-1", "group-2"], { name: "test" });

    const filter = (mutate as any).mock.calls[0][0];

    expect(filter({ id: "any", group: "group-1" })).toBe(true);
    expect(filter({ id: "any", group: "group-2" })).toBe(true);
    expect(filter({ id: "any", group: "group-3" })).toBe(false);
  });

  it("should pass newData and revalidate options to global mutate", async () => {
    const newData = { name: "new-data" };
    await mutateByGroup("group-1", newData, { revalidate: false });

    const dataUpdater = (mutate as any).mock.calls[0][1];
    const options = (mutate as any).mock.calls[0][2];

    expect(dataUpdater()).toEqual(newData);
    expect(options.revalidate).toBe(false);
  });

  it("should throw a descriptive error on failure", async () => {
    const originalError = new Error("SWR mutation failed");
    (mutate as any).mockRejectedValue(originalError);

    const groups = ["group-1", "group-2"];

    await expect(mutateByGroup(groups, { name: "test" })).rejects.toThrow(
      `Failed to mutate cache by group(s): ${groups.join(", ")}`
    );
  });
});
