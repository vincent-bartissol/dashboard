import type { DemoUser } from "@/lib/demo/types";

export function adminRoleLabel(user: DemoUser): "admin" | "user" {
  return user.role === "admin" ? "admin" : "user";
}

export function adminUserStatus(user: DemoUser): "active" | "banned" | "unverified" {
  if (user.banned) return "banned";
  if (!user.emailVerified) return "unverified";
  return "active";
}
