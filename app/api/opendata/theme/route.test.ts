import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    opendataThemeLimit: { check: vi.fn() },
  };
});

vi.mock("@/lib/opendata/theme-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/opendata/theme-api")>();
  return {
    ...actual,
    loadThemePage: vi.fn(),
    loadThemeMarkers: vi.fn(),
  };
});

import { loadThemeMarkers, loadThemePage } from "@/lib/opendata/theme-api";
import { opendataThemeLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { GET } from "./route";

const getSessionMock = vi.mocked(getSession);
const rateLimitMock = vi.mocked(opendataThemeLimit.check);
const loadPageMock = vi.mocked(loadThemePage);
const loadMarkersMock = vi.mocked(loadThemeMarkers);

const USER = { id: "user-1", role: "user", banned: false as boolean | null, banExpires: null };
const PAGE = { total_count: 1, results: [{ id_marche: "1" }] };

async function jsonOf(response: Response) {
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    retryAfter: response.headers.get("Retry-After"),
  };
}

describe("GET /api/opendata/theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { ...USER } } as Awaited<ReturnType<typeof getSession>>);
    rateLimitMock.mockReturnValue({ ok: true });
    loadPageMock.mockResolvedValue({
      ok: true,
      page: PAGE,
      nextOffset: 1,
      hasMore: false,
    });
    loadMarkersMock.mockResolvedValue({ ok: true, page: PAGE });
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { status } = await jsonOf(
      await GET(
        new NextRequest(
          "http://localhost/api/opendata/theme?dataset=marches-decouverts",
        ),
      ),
    );
    expect(status).toBe(401);
  });

  it("returns 429 with Retry-After when limited", async () => {
    rateLimitMock.mockReturnValue({ ok: false, retryAfterSec: 4 });
    const { status, retryAfter } = await jsonOf(
      await GET(
        new NextRequest(
          "http://localhost/api/opendata/theme?dataset=marches-decouverts",
        ),
      ),
    );
    expect(status).toBe(429);
    expect(retryAfter).toBe("4");
  });

  it("returns 400 for unknown datasets", async () => {
    const { status, body } = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/theme?dataset=nope")),
    );
    expect(status).toBe(400);
    expect(body).toEqual({ ok: false, error: "unknown_dataset" });
  });

  it("loads table pages and marker mode", async () => {
    const table = await jsonOf(
      await GET(
        new NextRequest(
          "http://localhost/api/opendata/theme?dataset=marches-decouverts",
        ),
      ),
    );
    expect(table.status).toBe(200);
    expect(loadPageMock).toHaveBeenCalled();

    const markers = await jsonOf(
      await GET(
        new NextRequest(
          "http://localhost/api/opendata/theme?dataset=marches-decouverts&mode=markers",
        ),
      ),
    );
    expect(markers.status).toBe(200);
    expect(loadMarkersMock).toHaveBeenCalled();
  });
});
