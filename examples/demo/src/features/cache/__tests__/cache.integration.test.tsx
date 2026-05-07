import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SWRConfig } from "swr";

import { CacheViewer } from "@demo/features/cache/CacheViewer";

describe("CacheViewer component", () => {
  it("should display a placeholder message when no snapshot has been taken", () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CacheViewer />
      </SWRConfig>
    );

    expect(
      screen.getByText(/No snapshot yet. Click refresh to inspect current SWR cache./i)
    ).toBeTruthy();
  });

  it("should render cache entries after clicking refresh", async () => {
    const cache = new Map();
    cache.set("test-key", { id: 1, text: "Cache data" });

    render(
      <SWRConfig value={{ provider: () => cache }}>
        <CacheViewer />
      </SWRConfig>
    );

    const refreshButton = screen.getByRole("button", { name: /Refresh cache snapshot/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText(/Entry 1/i)).toBeTruthy();
      expect(screen.getByText(/"test-key"/i)).toBeTruthy();
      expect(screen.getByText(/"text": "Cache data"/i)).toBeTruthy();
    });
  });
});
