import type { DemoActivity, DemoUser } from "@/lib/demo/types";

const SEED_DOMAIN = "seed.local";

export const DEMO_OTP_CODE = "123456";

export const DEMO_VISITOR: DemoUser = {
  id: "demo-visitor",
  name: "Camille Demo",
  email: "camille@demo.local",
  emailVerified: true,
  role: "user",
  banned: false,
  banReason: null,
  createdAt: "2026-01-15T10:00:00.000Z",
  arrondissement: "11",
  firstName: "Camille",
  lastName: "Demo",
};

export const DEMO_ADMIN: DemoUser = {
  id: "demo-admin",
  name: "Alex Admin",
  email: "admin@demo.local",
  emailVerified: true,
  role: "admin",
  banned: false,
  banReason: null,
  createdAt: "2025-11-01T09:00:00.000Z",
  arrondissement: "03",
  firstName: "Alex",
  lastName: "Admin",
};

const SEED_PEOPLE: Omit<DemoUser, "id" | "createdAt">[] = [
  {
    name: "Alice Martin",
    email: `alice@${SEED_DOMAIN}`,
    emailVerified: true,
    role: "user",
    banned: false,
    banReason: null,
    arrondissement: "11",
    firstName: "Alice",
    lastName: "Martin",
  },
  {
    name: "Bruno Dupont",
    email: `bruno@${SEED_DOMAIN}`,
    emailVerified: true,
    role: "user",
    banned: false,
    banReason: null,
    arrondissement: "15",
    firstName: "Bruno",
    lastName: "Dupont",
  },
  {
    name: "Chloé Bernard",
    email: `chloe@${SEED_DOMAIN}`,
    emailVerified: false,
    role: "user",
    banned: false,
    banReason: null,
    arrondissement: "03",
    firstName: "Chloé",
    lastName: "Bernard",
  },
  {
    name: "Diego Lopez",
    email: `diego@${SEED_DOMAIN}`,
    emailVerified: true,
    role: "user",
    banned: true,
    banReason: "Spam signalé (démo)",
    arrondissement: "montreuil",
    firstName: "Diego",
    lastName: "Lopez",
  },
  {
    name: "Emma Petit",
    email: `emma@${SEED_DOMAIN}`,
    emailVerified: true,
    role: "user",
    banned: false,
    banReason: null,
    arrondissement: "07",
    firstName: "Emma",
    lastName: "Petit",
  },
  {
    name: "Farid Hassan",
    email: `farid@${SEED_DOMAIN}`,
    emailVerified: true,
    role: "admin",
    banned: false,
    banReason: null,
    arrondissement: "19",
    firstName: "Farid",
    lastName: "Hassan",
  },
  {
    name: "Gina Rossi",
    email: `gina@${SEED_DOMAIN}`,
    emailVerified: true,
    role: "user",
    banned: false,
    banReason: null,
    arrondissement: "12",
    firstName: "Gina",
    lastName: "Rossi",
  },
  {
    name: "Hugo Leroy",
    email: `hugo@${SEED_DOMAIN}`,
    emailVerified: true,
    role: "user",
    banned: false,
    banReason: null,
    arrondissement: "18",
    firstName: "Hugo",
    lastName: "Leroy",
  },
];

export function createSeedUsers(): DemoUser[] {
  const seeded = SEED_PEOPLE.map((person, index) => ({
    ...person,
    id: `seed-user-${index + 1}`,
    createdAt: new Date(Date.UTC(2026, 0, 10 + index, 12, 0, 0)).toISOString(),
  }));
  return [DEMO_ADMIN, DEMO_VISITOR, ...seeded];
}

export function createSeedActivity(users: DemoUser[]): DemoActivity[] {
  const actions = ["login", "signup", "favorite.add", "profile.update", "admin.ban"] as const;
  return users.slice(0, 8).flatMap((user, index) =>
    actions.slice(0, 2 + (index % 3)).map((action, actionIndex) => ({
      id: `seed-activity-${user.id}-${actionIndex}`,
      userId: user.id,
      action,
      createdAt: new Date(Date.UTC(2026, 2, 1 + index, 8 + actionIndex, 0, 0)).toISOString(),
      metadata: action.startsWith("admin.")
        ? JSON.stringify({ targetUserId: users[(index + 1) % users.length]?.id })
        : null,
    })),
  );
}

/** Fixed user used when statically rendering dashboard pages. */
export const BUILD_DEMO_USER = DEMO_VISITOR;
