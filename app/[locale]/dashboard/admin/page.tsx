import { bindLocale } from "@/lib/demo/locale-page";
import { Suspense } from "react";
import { AdminHomeClient } from "@/components/admin/admin-home-client";

export default async function AdminPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  return (
    <Suspense fallback={null}>
      <AdminHomeClient />
    </Suspense>
  );
}
