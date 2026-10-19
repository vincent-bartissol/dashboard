import { AdminUserDetailClient } from "@/components/admin/admin-user-detail-client";
import { createSeedUsers } from "@/lib/demo/seed";
import { bindLocale } from "@/lib/demo/locale-page";

export function generateStaticParams() {
  return createSeedUsers().map((user) => ({ id: user.id }));
}

export default async function AdminUserDetailPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; id: string }>;
}>) {
  const resolved = await params;
  await bindLocale(Promise.resolve({ locale: resolved.locale }));
  const user = createSeedUsers().find((row) => row.id === resolved.id);
  return <AdminUserDetailClient userId={user?.id ?? resolved.id} />;
}
