import { CacheViewer } from "@demo/features/cache/CacheViewer";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { describe, expect, it } from "vitest";

const NO_SNAPSHOT_YET =
  /No snapshot yet\. Click refresh to inspect current SWR cache\./i;
const ENTRY_1 = /Entry 1/i;
const TEST_KEY = /"test-key"/i;
const TEXT_CACHE_DATA = /"text": "Cache data"/i;
const REFRESH_CACHE_SNAPSHOT = /Refresh cache snapshot/i;

describe("CacheViewer component", () => {
  it("should display a placeholder message when no snapshot has been taken", () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <CacheViewer />
      </SWRConfig>
    );

    expect(screen.getByText(NO_SNAPSHOT_YET)).toBeTruthy();
  });

  it("should render cache entries after clicking refresh", async () => {
    const cache = new Map();
    cache.set("test-key", { id: 1, text: "Cache data" });

    render(
      <SWRConfig value={{ provider: () => cache }}>
        <CacheViewer />
      </SWRConfig>
    );

    const refreshButton = screen.getByRole("button", {
      name: REFRESH_CACHE_SNAPSHOT,
    });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText(ENTRY_1)).toBeTruthy();
      expect(screen.getByText(TEST_KEY)).toBeTruthy();
      expect(screen.getByText(TEXT_CACHE_DATA)).toBeTruthy();
    });
  });
});
