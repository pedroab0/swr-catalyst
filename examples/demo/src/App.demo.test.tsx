import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("demo app smoke test", () => {
  it("should render the app and show initial todos", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("swr-catalyst demo app")).toBeTruthy();
      expect(screen.getByText("Document API behavior")).toBeTruthy();
    });
  });
});
