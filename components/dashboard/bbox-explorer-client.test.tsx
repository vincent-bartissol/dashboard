// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fr from "@/messages/fr.json";
import { toExplorerDataset } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import {
  BboxExplorerClient,
  fetchBboxRecords,
  type Bbox,
} from "./bbox-explorer-client";

vi.mock("@/components/dashboard/theme-explorer-client", () => ({
  ThemeExplorerClient: ({
    totalCount,
    onBbox,
  }: {
    totalCount: number;
    onBbox?: (bbox: Bbox) => void;
  }) => (
    <div>
      <p data-testid="total-count">{totalCount}</p>
      <button
        type="button"
        onClick={() =>
          onBbox?.({ south: 48.82, west: 2.23, north: 48.9, east: 2.45 })
        }
      >
        pan
      </button>
    </div>
  ),
}));

const dataset = toExplorerDataset(DATASETS.trees);
const initial = {
  total_count: 10,
  results: [{ idbase: "1", libellefrancais: "Platane" }],
};

function renderExplorer() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
    },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="fr" messages={fr}>
        <BboxExplorerClient
          dataset={dataset}
          initial={initial}
          favoriteIds={[]}
        />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe("fetchBboxRecords", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the page when the session API succeeds", async () => {
    const page = { total_count: 2, results: [{ idbase: "a" }, { idbase: "b" }] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, page }),
      }),
    );
    await expect(
      fetchBboxRecords("les-arbres", {
        south: 48.82,
        west: 2.23,
        north: 48.9,
        east: 2.45,
      }),
    ).resolves.toEqual(page);
  });

  it("throws rate_limited on 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ ok: false, error: "rate_limited" }),
      }),
    );
    await expect(
      fetchBboxRecords("les-arbres", {
        south: 48.82,
        west: 2.23,
        north: 48.9,
        east: 2.45,
      }),
    ).rejects.toThrow("rate_limited");
  });
});

describe("BboxExplorerClient", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refetches records after a debounced map pan", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          page: { total_count: 42, results: [{ idbase: "9" }] },
        }),
      }),
    );

    renderExplorer();
    expect(screen.getByTestId("total-count")).toHaveTextContent("10");

    await user.click(screen.getByRole("button", { name: "pan" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await waitFor(() => {
      expect(screen.getByTestId("total-count")).toHaveTextContent("42");
    });
  });

  it("shows the rate-limit message when the API returns 429", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ ok: false, error: "rate_limited" }),
      }),
    );

    renderExplorer();
    await user.click(screen.getByRole("button", { name: "pan" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        "Trop de requêtes carte. Réessayez dans un instant.",
      );
    });
  });
});
