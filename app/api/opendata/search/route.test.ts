import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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

const USER = { id: "user-1", role: "user", banned: false as boolean | null, banExpires: null };

async function jsonOf(response: Response) {
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    retryAfter: response.headers.get("Retry-After"),
  };
}

describe("GET /api/opendata/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { ...USER } } as Awaited<ReturnType<typeof getSession>>);
    rateLimitMock.mockReturnValue({ ok: true });
    searchMock.mockResolvedValue([]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { status, body } = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/search?q=na")),
    );
    expect(status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns 429 with Retry-After when limited", async () => {
    rateLimitMock.mockReturnValue({ ok: false, retryAfterSec: 9 });
    const { status, body, retryAfter } = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/search?q=na")),
    );
    expect(status).toBe(429);
    expect(body).toEqual({ ok: false, error: "rate_limited" });
    expect(retryAfter).toBe("9");
  });

  it("returns empty results for short queries", async () => {
    const { status, body } = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/search?q=a")),
    );
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true, results: [] });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("returns search hits", async () => {
    searchMock.mockResolvedValue([
      {
        datasetId: "velib-disponibilite-en-temps-reel",
        datasetTitle: "Vélib",
        recordId: "11030",
        label: "Nation",
        href: "/dashboard/velib",
      },
    ]);
    const { status, body } = await jsonOf(
      await GET(new NextRequest("http://localhost/api/opendata/search?q=nation")),
    );
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(searchMock).toHaveBeenCalledWith("nation");
  });
});
