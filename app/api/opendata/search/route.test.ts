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
    opendataSearchLimit: { check: vi.fn() },
  };
});

vi.mock("@/lib/opendata/global-search", () => ({
  searchOpenData: vi.fn(),
}));

import { searchOpenData } from "@/lib/opendata/global-search";
import { opendataSearchLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { GET } from "./route";

const getSessionMock = vi.mocked(getSession);
const rateLimitMock = vi.mocked(opendataSearchLimit.check);
const searchMock = vi.mocked(searchOpenData);

describe("GET /api/opendata/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser(getSessionMock);
    rateLimitMock.mockReturnValue({ ok: true });
    searchMock.mockResolvedValue([]);
  });

  it("gates auth and rate limits", async () => {
    mockSessionUser(getSessionMock, null);
    expect(
      (await jsonOf(await GET(new NextRequest("http://localhost/api/opendata/search?q=na")))).status,
    ).toBe(401);

    mockSessionUser(getSessionMock, API_TEST_USER);
    rateLimitMock.mockReturnValue({ ok: false, retryAfterSec: 9 });
    const limited = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/search?q=na")),
    );
    expect(limited.status).toBe(429);
    expect(limited.retryAfter).toBe("9");
  });

  it("short-circuits short queries and returns hits", async () => {
    const short = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/search?q=a")),
    );
    expect(short.body).toEqual({ ok: true, results: [] });
    expect(searchMock).not.toHaveBeenCalled();

    searchMock.mockResolvedValue([
      {
        datasetId: "velib-disponibilite-en-temps-reel",
        datasetTitle: "Vélib",
        recordId: "11030",
        label: "Nation",
        href: "/dashboard/velib",
      },
    ]);
    const hits = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/search?q=nation")),
    );
    expect(hits.status).toBe(200);
    expect(searchMock).toHaveBeenCalledWith("nation");
  });
});
