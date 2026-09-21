import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.hoisted(() => {
  process.env.DATA_DIR = `/tmp/dashboard-actions-${process.pid}-${Date.now()}`;
});

vi.mock("@/lib/session", () => ({
  requireSession: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

import { toggleFavorite } from "@/lib/actions/favorites";
import { updateProfile } from "@/lib/actions/profile";
import { db } from "@/lib/db";
import { getProfile, listFavorites } from "@/lib/db/queries";
import { activity, favorite, profile, user } from "@/lib/db/schema";
import { FAVORITE_MAX } from "@/lib/favorite-input";
import { requireSession } from "@/lib/session";

const requireSessionMock = vi.mocked(requireSession);
const USER_ID = "action-user-1";
const VELIB = "velib-disponibilite-en-temps-reel";

function session() {
  return {
    user: { id: USER_ID, role: "user", banned: false, email: "action@localhost", name: "Action" },
  } as Awaited<ReturnType<typeof requireSession>>;
}

describe("toggleFavorite and updateProfile", () => {
  beforeAll(async () => {
    expect(process.env.DATA_DIR).toContain("dashboard-actions-");
    await db.insert(user).values({
      id: USER_ID,
      name: "Action",
      email: "action@localhost",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    requireSessionMock.mockResolvedValue(session());
    await db.delete(favorite).where(eq(favorite.userId, USER_ID));
    await db.delete(profile).where(eq(profile.userId, USER_ID));
    await db.delete(activity).where(eq(activity.userId, USER_ID));
  });

  it("adds then removes a favorite", async () => {
    const input = {
      datasetId: VELIB,
      recordId: "12345",
      label: "Station Test",
      geo: '{"lat":48.85,"lon":2.35}',
    };
    await expect(toggleFavorite(input)).resolves.toEqual({ ok: true });
    const added = await listFavorites(USER_ID);
    expect(added).toHaveLength(1);
    expect(added[0]).toMatchObject({
      datasetId: VELIB,
      recordId: "12345",
      label: "Station Test",
    });

    await expect(toggleFavorite(input)).resolves.toEqual({ ok: true });
    await expect(listFavorites(USER_ID)).resolves.toEqual([]);
  });

  it("rejects an unknown dataset without writing", async () => {
    await expect(
      toggleFavorite({
        datasetId: "not-a-dataset",
        recordId: "1",
        label: "Nope",
      }),
    ).resolves.toEqual({ ok: false, error: "favorite" });
    await expect(listFavorites(USER_ID)).resolves.toEqual([]);
  });

  it("returns favoriteLimit at 100 rows", async () => {
    await db.insert(favorite).values(
      Array.from({ length: FAVORITE_MAX }, (_, index) => ({
        id: `fav-${index}`,
        userId: USER_ID,
        datasetId: VELIB,
        recordId: `station-${index}`,
        label: `Station ${index}`,
        geo: null,
        createdAt: new Date(),
      })),
    );
    await expect(
      toggleFavorite({
        datasetId: VELIB,
        recordId: "station-new",
        label: "Overflow",
      }),
    ).resolves.toEqual({ ok: false, error: "favoriteLimit" });
    await expect(listFavorites(USER_ID)).resolves.toHaveLength(FAVORITE_MAX);
  });

  it("persists names and preferred district", async () => {
    await expect(
      updateProfile({
        firstName: "Ada",
        lastName: "Lovelace",
        arrondissement: "11",
      }),
    ).resolves.toEqual({ ok: true });

    await expect(getProfile(USER_ID)).resolves.toMatchObject({
      firstName: "Ada",
      lastName: "Lovelace",
      arrondissement: "11",
    });
    const row = await db.select().from(user).where(eq(user.id, USER_ID)).limit(1);
    expect(row[0]?.name).toBe("Ada Lovelace");
  });

  it("rejects empty names and invalid districts", async () => {
    await expect(
      updateProfile({ firstName: "  ", lastName: "Lovelace", arrondissement: null }),
    ).resolves.toEqual({ ok: false, error: "namesRequired" });
    await expect(
      updateProfile({ firstName: "Ada", lastName: "Lovelace", arrondissement: "99" }),
    ).resolves.toEqual({ ok: false, error: "invalidDistrict" });
    await expect(getProfile(USER_ID)).resolves.toMatchObject({
      firstName: null,
      lastName: null,
      arrondissement: null,
    });
  });
});
