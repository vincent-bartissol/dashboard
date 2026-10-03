import { vi } from "vitest";
import type { getSession } from "@/lib/session";

export const API_TEST_USER = {
  id: "user-1",
  role: "user",
  banned: false as boolean | null,
  banExpires: null,
};

export function mockSessionUser(
  getSessionMock: ReturnType<typeof vi.mocked<typeof getSession>>,
  user: Partial<typeof API_TEST_USER> | null = API_TEST_USER,
) {
  if (user == null) {
    getSessionMock.mockResolvedValue(null);
    return;
  }
  getSessionMock.mockResolvedValue({
    user: { ...API_TEST_USER, ...user },
  } as Awaited<ReturnType<typeof getSession>>);
}

export async function jsonOf(response: Response) {
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
    retryAfter: response.headers.get("Retry-After"),
  };
}
