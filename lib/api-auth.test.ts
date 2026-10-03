import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

import { requireApiSession } from "./api-auth";
import { getSession } from "./session";

const getSessionMock = vi.mocked(getSession);

describe("requireApiSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects missing sessions", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await requireApiSession({ check: () => ({ ok: true }) });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("rejects banned users", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", role: "user", banned: true, banExpires: null },
    } as Awaited<ReturnType<typeof getSession>>);
    const result = await requireApiSession({ check: () => ({ ok: true }) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("attaches Retry-After on rate limits", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", role: "user", banned: false, banExpires: null },
    } as Awaited<ReturnType<typeof getSession>>);
    const result = await requireApiSession({
      check: () => ({ ok: false, retryAfterSec: 15 }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(429);
      expect(result.response.headers.get("Retry-After")).toBe("15");
    }
  });

  it("requires admin when requested", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", role: "user", banned: false, banExpires: null },
    } as Awaited<ReturnType<typeof getSession>>);
    const result = await requireApiSession({ check: () => ({ ok: true }) }, { admin: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });
});
