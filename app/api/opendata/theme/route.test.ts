import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { API_TEST_USER, jsonOf, mockSessionUser } from "@/lib/api-route-test";

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

const PAGE = { total_count: 1, results: [{ id_marche: "1" }] };
const marketsUrl = "http://localhost/api/opendata/theme?dataset=marches-decouverts";

describe("GET /api/opendata/theme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser(getSessionMock);
    rateLimitMock.mockReturnValue({ ok: true });
    loadPageMock.mockResolvedValue({
      ok: true,
      page: PAGE,
      nextOffset: 1,
      hasMore: false,
    });
    loadMarkersMock.mockResolvedValue({ ok: true, page: PAGE });
  });

  it("gates auth, rate limits, and unknown datasets", async () => {
    mockSessionUser(getSessionMock, null);
    expect((await jsonOf(await GET(new NextRequest(marketsUrl)))).status).toBe(401);

    mockSessionUser(getSessionMock, API_TEST_USER);
    rateLimitMock.mockReturnValue({ ok: false, retryAfterSec: 4 });
    const limited = await jsonOf(await GET(new NextRequest(marketsUrl)));
    expect(limited.status).toBe(429);
    expect(limited.retryAfter).toBe("4");

    rateLimitMock.mockReturnValue({ ok: true });
    const unknown = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/theme?dataset=nope")),
    );
    expect(unknown.body).toEqual({ ok: false, error: "unknown_dataset" });
  });

  it("loads table and marker modes", async () => {
    expect((await jsonOf(await GET(new NextRequest(marketsUrl)))).status).toBe(200);
    expect(loadPageMock).toHaveBeenCalled();

    expect(
      (
        await jsonOf(await GET(new NextRequest(`${marketsUrl}&mode=markers`)))
      ).status,
    ).toBe(200);
    expect(loadMarkersMock).toHaveBeenCalled();
  });
});
