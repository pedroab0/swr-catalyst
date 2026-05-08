import App from "@demo/App";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const EVENT_TITLE_PATTERN = /Event #/;

describe("timeline feature", () => {
  it("should create timeline entries and cache diff from utilities actions", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "mutateById revalidate" })
    );

    await waitFor(() => {
      expect(
        screen.getAllByText("mutateById revalidate").length
      ).toBeGreaterThan(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Show cache diff" }));

    await waitFor(() => {
      expect(screen.getByText(EVENT_TITLE_PATTERN)).toBeTruthy();
    });
  });
});
