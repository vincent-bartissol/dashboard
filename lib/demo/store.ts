"use client";

import {
  BUILD_DEMO_USER,
  createSeedActivity,
  createSeedUsers,
  DEMO_ADMIN,
  DEMO_VISITOR,
} from "@/lib/demo/seed";
import type {
  DemoFavorite,
  DemoRole,
  DemoSession,
  DemoStoreState,
  DemoUser,
} from "@/lib/demo/types";

const STORAGE_KEY = "paris-ouverte-demo-v1";

function defaultState(): DemoStoreState {
  const users = createSeedUsers();
  return {
    session: null,
    users,
    favorites: [],
    activity: createSeedActivity(users),
    pendingEmail: null,
  };
}

function readState(): DemoStoreState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as DemoStoreState;
    if (!parsed || !Array.isArray(parsed.users)) return defaultState();
    return {
      ...defaultState(),
      ...parsed,
      users: parsed.users.length > 0 ? parsed.users : createSeedUsers(),
    };
  } catch {
    return defaultState();
  }
}

function writeState(state: DemoStoreState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("paris-ouverte-demo"));
}

export function getDemoState(): DemoStoreState {
  return readState();
}

export function subscribeDemoStore(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener("paris-ouverte-demo", listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("paris-ouverte-demo", listener);
  };
}

function sessionFromUser(user: DemoUser): DemoSession {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

export function signInAs(role: DemoRole, email?: string, name?: string): DemoSession {
  const state = readState();
  const template = role === "admin" ? DEMO_ADMIN : DEMO_VISITOR;
  const user: DemoUser = {
    ...template,
    email: email?.trim() || template.email,
    name: name?.trim() || template.name,
    firstName: (name ?? template.name).split(" ")[0] ?? template.firstName,
    lastName: (name ?? template.name).split(" ").slice(1).join(" ") || template.lastName,
    emailVerified: true,
    role,
  };
  const users = state.users.some((row) => row.id === user.id)
    ? state.users.map((row) => (row.id === user.id ? { ...row, ...user } : row))
    : [user, ...state.users];
  const session = sessionFromUser(user);
  writeState({ ...state, users, session, pendingEmail: null });
  return session;
}

export function signUpDemo(input: {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
}): DemoSession {
  const state = readState();
  const user: DemoUser = {
    id: `demo-signup-${Date.now()}`,
    email: input.email.trim(),
    name: input.name.trim() || `${input.firstName} ${input.lastName}`.trim(),
    firstName: input.firstName,
    lastName: input.lastName,
    emailVerified: false,
    role: "user",
    banned: false,
    banReason: null,
    createdAt: new Date().toISOString(),
    arrondissement: null,
  };
  const session = sessionFromUser(user);
  writeState({
    ...state,
    users: [user, ...state.users],
    session,
    pendingEmail: { kind: "verification", email: user.email },
  });
  return session;
}

export function markEmailVerified(): DemoSession | null {
  const state = readState();
  if (!state.session) return null;
  const users = state.users.map((user) =>
    user.id === state.session?.userId ? { ...user, emailVerified: true } : user,
  );
  const session = { ...state.session, emailVerified: true };
  writeState({ ...state, users, session, pendingEmail: null });
  return session;
}

export function requestOtpDemo(email: string) {
  const state = readState();
  writeState({
    ...state,
    pendingEmail: { kind: "otp", email },
  });
}

export function requestResetDemo(email: string) {
  const state = readState();
  writeState({
    ...state,
    pendingEmail: { kind: "reset", email },
  });
}

export function requestChangeEmailDemo(newEmail: string) {
  const state = readState();
  if (!state.session) return;
  writeState({
    ...state,
    pendingEmail: {
      kind: "change-email",
      email: state.session.email,
      newEmail,
    },
  });
}

export function applyChangeEmailDemo(): DemoSession | null {
  const state = readState();
  if (!state.session || !state.pendingEmail?.newEmail) return state.session;
  const newEmail = state.pendingEmail.newEmail;
  const users = state.users.map((user) =>
    user.id === state.session?.userId ? { ...user, email: newEmail, emailVerified: true } : user,
  );
  const session = { ...state.session, email: newEmail, emailVerified: true };
  writeState({ ...state, users, session, pendingEmail: null });
  return session;
}

export function signOutDemo() {
  const state = readState();
  writeState({ ...state, session: null, pendingEmail: null });
}

export function updateDemoProfile(input: {
  firstName: string;
  lastName: string;
  arrondissement: string | null;
}) {
  const state = readState();
  if (!state.session) return { ok: false as const, error: "auth" };
  const name = `${input.firstName} ${input.lastName}`.trim();
  const users = state.users.map((user) =>
    user.id === state.session?.userId
      ? {
          ...user,
          firstName: input.firstName,
          lastName: input.lastName,
          name,
          arrondissement: input.arrondissement,
        }
      : user,
  );
  const session = { ...state.session, name };
  writeState({ ...state, users, session });
  return { ok: true as const, arrondissement: input.arrondissement };
}

export function listDemoFavorites(): DemoFavorite[] {
  return readState().favorites;
}

export function toggleDemoFavorite(input: {
  datasetId: string;
  recordId: string;
  label: string;
  geo?: string | null;
}): DemoFavorite[] {
  const state = readState();
  const exists = state.favorites.find(
    (row) => row.datasetId === input.datasetId && row.recordId === input.recordId,
  );
  const favorites = exists
    ? state.favorites.filter(
        (row) => !(row.datasetId === input.datasetId && row.recordId === input.recordId),
      )
    : [
        ...state.favorites,
        {
          id: `fav-${Date.now()}`,
          datasetId: input.datasetId,
          recordId: input.recordId,
          label: input.label,
          geo: input.geo ?? null,
        },
      ];
  writeState({ ...state, favorites });
  return favorites;
}

export function listDemoUsers(): DemoUser[] {
  return readState().users;
}

export function getDemoUser(id: string): DemoUser | undefined {
  return readState().users.find((user) => user.id === id);
}

export function banDemoUser(userId: string, banReason?: string) {
  const state = readState();
  if (state.session?.userId === userId) return { ok: false as const, error: "selfBan" };
  const target = state.users.find((user) => user.id === userId);
  if (!target) return { ok: false as const, error: "notFound" };
  if (target.role === "admin") return { ok: false as const, error: "peerAdmin" };
  const users = state.users.map((user) =>
    user.id === userId
      ? { ...user, banned: true, banReason: banReason?.trim() || "Banned (demo)" }
      : user,
  );
  writeState({ ...state, users });
  return { ok: true as const };
}

export function unbanDemoUser(userId: string) {
  const state = readState();
  const target = state.users.find((user) => user.id === userId);
  if (!target) return { ok: false as const, error: "notFound" };
  const users = state.users.map((user) =>
    user.id === userId ? { ...user, banned: false, banReason: null } : user,
  );
  writeState({ ...state, users });
  return { ok: true as const };
}

export function setDemoUserRole(userId: string, role: DemoRole) {
  const state = readState();
  if (state.session?.userId === userId && role === "user") {
    return { ok: false as const, error: "selfDemote" };
  }
  const target = state.users.find((user) => user.id === userId);
  if (!target) return { ok: false as const, error: "notFound" };
  if (role === "user") {
    const admins = state.users.filter((user) => user.role === "admin" && !user.banned);
    if (admins.length <= 1 && target.role === "admin") {
      return { ok: false as const, error: "lastAdmin" };
    }
  }
  const users = state.users.map((user) => (user.id === userId ? { ...user, role } : user));
  writeState({ ...state, users });
  return { ok: true as const };
}

export function revokeDemoSession() {
  return { ok: true as const };
}

export function buildTimeDemoUser() {
  return BUILD_DEMO_USER;
}
