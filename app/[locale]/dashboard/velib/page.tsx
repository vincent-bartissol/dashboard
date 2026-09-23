import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/dashboard/page-intro";
import { VelibLiveExplorer } from "@/components/dashboard/velib-live-explorer";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadThemeExplorer } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function VelibPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.velib");
  const loaded = await loadThemeExplorer(DATASETS.velib, session.user.id);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.velib}>
        {t("body")}
      </PageIntro>
      <VelibLiveExplorer
        dataset={await localizeExplorerDataset(DATASETS.velib)}
        initial={loaded.table}
        mapRecords={loaded.markers.results}
        favoriteIds={loaded.favoriteIds}
        initialError={loaded.ok ? null : loaded.error}
      />
    </div>
  );
}
