import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({
  getProfile: vi.fn(),
}));

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    opendataRecordsLimit: { check: vi.fn() },
  };
});

vi.mock("@/lib/opendata/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/opendata/client")>();
  return {
    ...actual,
    fetchRecordsSafe: vi.fn(),
  };
});

import { getProfile } from "@/lib/db/queries";
import { fetchRecordsSafe } from "@/lib/opendata/client";
import { opendataRecordsLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { GET } from "./route";

const getSessionMock = vi.mocked(getSession);
const getProfileMock = vi.mocked(getProfile);
const rateLimitMock = vi.mocked(opendataRecordsLimit.check);
const fetchRecordsSafeMock = vi.mocked(fetchRecordsSafe);

const USER = { id: "user-1", role: "user", banned: false as boolean | null, banExpires: null };
const PAGE = { total_count: 2, results: [{ idbase: "1" }, { idbase: "2" }] };

function treesUrl(extra: Record<string, string> = {}) {
  const params = new URLSearchParams({
    dataset: "les-arbres",
    south: "48.82",
    west: "2.23",
    north: "48.90",
    east: "2.45",
    ...extra,
  });
  return new NextRequest(`http://localhost:3000/api/opendata/records?${params}`);
}

async function jsonOf(response: Response) {
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    retryAfter: response.headers.get("Retry-After"),
  };
}

describe("GET /api/opendata/records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { ...USER } } as Awaited<ReturnType<typeof getSession>>);
    getProfileMock.mockResolvedValue({
      userId: USER.id,
      firstName: null,
      lastName: null,
      arrondissement: null,
    });
    rateLimitMock.mockReturnValue({ ok: true });
    fetchRecordsSafeMock.mockResolvedValue({ ok: true, page: PAGE });
  });

  it("returns 401 when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { status, body } = await jsonOf(await GET(treesUrl()));
    expect(status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
    expect(fetchRecordsSafeMock).not.toHaveBeenCalled();
  });

  it("returns 401 when the user is banned", async () => {
    getSessionMock.mockResolvedValue({
      user: { ...USER, banned: true },
    } as Awaited<ReturnType<typeof getSession>>);
    const { status, body } = await jsonOf(await GET(treesUrl()));
    expect(status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
    expect(fetchRecordsSafeMock).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the user is rate limited", async () => {
    rateLimitMock.mockReturnValue({ ok: false, retryAfterSec: 12 });
    const { status, body, retryAfter } = await jsonOf(await GET(treesUrl()));
    expect(status).toBe(429);
    expect(body).toEqual({ ok: false, error: "rate_limited" });
    expect(retryAfter).toBe("12");
    expect(fetchRecordsSafeMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid bbox", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/opendata/records?dataset=les-arbres&south=a&west=2&north=3&east=4",
    );
    const { status, body } = await jsonOf(await GET(request));
    expect(status).toBe(400);
    expect(body).toEqual({ ok: false, error: "invalid_bbox" });
  });

  it("returns 400 for a non-bbox dataset", async () => {
    const request = treesUrl({ dataset: "velib-disponibilite-en-temps-reel" });
    const { status, body } = await jsonOf(await GET(request));
    expect(status).toBe(400);
    expect(body).toEqual({ ok: false, error: "unknown_dataset" });
    expect(fetchRecordsSafeMock).not.toHaveBeenCalled();
  });

  it("rebuilds the district filter on the server and ignores a client where", async () => {
    getProfileMock.mockResolvedValue({
      userId: USER.id,
      firstName: null,
      lastName: null,
      arrondissement: "11",
    });
    await GET(
      treesUrl({
        where: "1=1 OR arrondissement='PARIS 1ER ARRDT'",
      }),
    );
    expect(fetchRecordsSafeMock).toHaveBeenCalledTimes(1);
    const [, params] = fetchRecordsSafeMock.mock.calls[0] ?? [];
    expect(params?.where).toBe(
      "arrondissement = 'PARIS 11E ARRDT' AND in_bbox(geo_point_2d,48.82,2.23,48.9,2.45)",
    );
    expect(params?.where).not.toContain("1=1");
    expect(params?.where).not.toContain("PARIS 1ER");
  });

  it("returns 502 when Open Data fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchRecordsSafeMock.mockResolvedValue({
      ok: false,
      page: { total_count: 0, results: [] },
      error: "Open Data les-arbres: 503",
    });
    const { status, body } = await jsonOf(await GET(treesUrl()));
    expect(status).toBe(502);
    expect(body).toEqual({
      ok: false,
      error: "opendata",
      page: { total_count: 0, results: [] },
    });
  });

  it("returns the page when Open Data succeeds", async () => {
    const { status, body } = await jsonOf(await GET(treesUrl()));
    expect(status).toBe(200);
    expect(body).toEqual({
      ok: true,
      page: PAGE,
      nextOffset: 2,
      hasMore: false,
    });
    expect(fetchRecordsSafeMock).toHaveBeenCalledWith(
      "les-arbres",
      expect.objectContaining({ limit: 50, offset: 0 }),
      86_400,
    );
  });

  it("forwards limit and offset and reports hasMore", async () => {
    fetchRecordsSafeMock.mockResolvedValue({
      ok: true,
      page: {
        total_count: 120,
        results: Array.from({ length: 50 }, (_, i) => ({ idbase: String(i) })),
      },
    });
    const { status, body } = await jsonOf(
      await GET(treesUrl({ limit: "50", offset: "50" })),
    );
    expect(status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      nextOffset: 100,
      hasMore: true,
    });
    expect(fetchRecordsSafeMock).toHaveBeenCalledWith(
      "les-arbres",
      expect.objectContaining({ limit: 50, offset: 50 }),
      86_400,
    );
  });

  it("clamps limit to max 100", async () => {
    await GET(treesUrl({ limit: "500" }));
    expect(fetchRecordsSafeMock).toHaveBeenCalledWith(
      "les-arbres",
      expect.objectContaining({ limit: 100 }),
      86_400,
    );
  });
});
