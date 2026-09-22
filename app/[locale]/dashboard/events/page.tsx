import { getTranslations } from "next-intl/server";
import { EventsInfiniteExplorer } from "@/components/dashboard/events-infinite-explorer";
import { PageIntro } from "@/components/dashboard/page-intro";
import { listFavorites, getProfile } from "@/lib/db/queries";
import { arrondissementWhere } from "@/lib/opendata/arrondissement";
import { fetchRecordsSafe, joinWhere } from "@/lib/opendata/client";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import { DATASETS } from "@/lib/opendata/datasets";
import { themeOrderBy } from "@/lib/opendata/order-by";
import { requireSession } from "@/lib/session";

export default async function EventsPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.events");
  const config = DATASETS.events;
  const profile = await getProfile(session.user.id);
  const district = arrondissementWhere(config, profile.arrondissement);
  const [result, favorites] = await Promise.all([
    fetchRecordsSafe(
      config.id,
      {
        limit: 50,
        offset: 0,
        where: joinWhere(district, config.defaultWhere),
        orderBy: themeOrderBy(config),
        host: config.host,
      },
      config.revalidate,
    ),
    listFavorites(session.user.id, config.id),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={config}>
        {t("body")}
      </PageIntro>
      <EventsInfiniteExplorer
        dataset={await localizeExplorerDataset(config)}
        initial={result.page}
        favoriteIds={favorites.map((item) => item.recordId)}
        initialError={result.ok ? null : result.error}
      />
    </div>
  );
}
