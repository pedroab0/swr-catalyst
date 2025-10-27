import { describe, expect, it } from "vitest";

import { to } from "./index";

describe("to", () => {
  it("should return [data, null] when the promise resolves", async () => {
    const promise = Promise.resolve("success");
    const [data, error] = await to(promise);

    expect(data).toBe("success");
    expect(error).toBeNull();
  });

  it("should return [null, error] when the promise rejects", async () => {
    const errorObject = new Error("failure");
    const promise = Promise.reject(errorObject);
    const [data, error] = await to(promise);

    expect(data).toBeNull();
    expect(error).toBe(errorObject);
  });
});
