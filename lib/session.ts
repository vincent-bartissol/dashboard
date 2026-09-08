import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireGuest(nextPath?: string | string[]) {
  const session = await getSession();
  if (session) {
    redirect(safeNext(nextPath));
  }
}
