import type { DatasetConfig } from "./client";

export const PARIS_CENTER = { lat: 48.8566, lon: 2.3522 };
export const PARIS_BBOX = {
  south: 48.815,
  west: 2.225,
  north: 48.902,
  east: 2.47,
};

export const ROBESPIERRE_CENTER = { lat: 48.85556, lon: 2.42361 };
export const MONTREUIL_BBOX = {
  south: 48.848,
  west: 2.414,
  north: 48.872,
  east: 2.455,
};

export const MONTREUIL_LANDMARKS = [
  {
    id: "metro-robespierre",
    position: ROBESPIERRE_CENTER,
    label: "Métro Robespierre",
    color: "#c8102e",
    description: "Ligne 9 · Île-de-France Mobilités",
  },
  {
    id: "rue-etienne-marcel",
    position: { lat: 48.85758, lon: 2.42649 },
    label: "Rue Étienne Marcel",
    color: "#3d7ea6",
    description: "Compteur vélos vers Paris / Croix de Chavaux",
  },
] as const;

export const DATASETS = {
  velib: {
    id: "velib-disponibilite-en-temps-reel",
    title: "Vélib’",
    sourceUrl:
      "https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/",
    revalidate: 60,
    geoField: "coordonnees_geo",
    idField: "stationcode",
    titleField: "name",
    bbox: false,
    district: {
      paris: ({ n }) =>
        n < 10
          ? `length(stationcode) = 4 AND stationcode like '${n}*'`
          : `stationcode like '${n}*'`,
      montreuil: `nom_arrondissement_communes = 'Montreuil'`,
    },
    columns: [
      { key: "name", label: "Station" },
      { key: "nom_arrondissement_communes", label: "Commune" },
      { key: "numbikesavailable", label: "Vélos" },
      { key: "mechanical", label: "Mécaniques" },
      { key: "ebike", label: "Électriques" },
      { key: "numdocksavailable", label: "Bornettes" },
    ],
  },
  trees: {
    id: "les-arbres",
    title: "Arbres",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/les-arbres/",
    revalidate: 86_400,
    geoField: "geo_point_2d",
    idField: "idbase",
    titleField: "libellefrancais",
    bbox: true,
    district: {
      paris: ({ ordinal }) => `arrondissement = 'PARIS ${ordinal} ARRDT'`,
    },
    columns: [
      { key: "libellefrancais", label: "Essence" },
      { key: "adresse", label: "Adresse" },
      { key: "arrondissement", label: "Arrondissement" },
      { key: "hauteurenm", label: "Hauteur (m)" },
      { key: "circonferenceencm", label: "Circonférence (cm)" },
    ],
  },
  parks: {
    id: "espaces_verts",
    title: "Espaces verts",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/espaces_verts/",
    revalidate: 86_400,
    geoField: "geom_x_y",
    idField: "nsq_espace_vert",
    titleField: "nom_ev",
    bbox: false,
    district: {
      paris: ({ zip }) => `adresse_codepostal = '${zip}'`,
    },
    columns: [
      { key: "nom_ev", label: "Nom" },
      { key: "type_ev", label: "Type" },
      { key: "categorie", label: "Catégorie" },
      { key: "adresse_codepostal", label: "Code postal" },
      { key: "surface_totale_reelle", label: "Surface (m²)" },
    ],
  },
  air: {
    id: "qualite-de-l-air-indice-atmo",
    title: "Qualité de l’air",
    sourceUrl:
      "https://opendata.paris.fr/explore/dataset/qualite-de-l-air-indice-atmo/",
    revalidate: 86_400,
    geoField: "",
    idField: "annee",
    titleField: "annee",
    bbox: false,
    columns: [
      { key: "annee", label: "Année" },
      { key: "ind_jour_qa_bonne", label: "Bonne" },
      { key: "ind_jour_qa_moyenne", label: "Moyenne" },
      { key: "ind_jour_qa_degradee", label: "Dégradée" },
      { key: "ind_jour_qa_mauvaise", label: "Mauvaise" },
      { key: "ind_jour_qa_tres_mauvaise", label: "Très mauvaise" },
      { key: "ind_jour_qa_extremement_mauvaise", label: "Extrêmement mauvaise" },
    ],
  },
  fountains: {
    id: "fontaines-a-boire",
    title: "Fontaines à boire",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/fontaines-a-boire/",
    revalidate: 86_400,
    geoField: "geo_point_2d",
    idField: "gid",
    titleField: "voie",
    bbox: false,
    district: {
      paris: ({ n, ordinal }) =>
        `(commune like '%${n}EME%' OR commune like '%${ordinal}%')`,
    },
    columns: [
      { key: "type_objet", label: "Type" },
      { key: "voie", label: "Voie" },
      { key: "commune", label: "Commune" },
      { key: "dispo", label: "Disponible" },
      { key: "modele", label: "Modèle" },
    ],
  },
  toilets: {
    id: "sanisettesparis",
    title: "Toilettes publiques",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/sanisettesparis/",
    revalidate: 86_400,
    geoField: "geo_point_2d",
    idField: "arrondissement,adresse",
    titleField: "adresse",
    bbox: false,
    district: {
      paris: ({ zip }) => `arrondissement = '${zip}'`,
    },
    columns: [
      { key: "type", label: "Type" },
      { key: "adresse", label: "Adresse" },
      { key: "arrondissement", label: "Arrondissement" },
      { key: "statut", label: "Statut" },
      { key: "horaire", label: "Horaires" },
      { key: "acces_pmr", label: "PMR" },
    ],
  },
  events: {
    id: "que-faire-a-paris-",
    title: "Que faire à Paris",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/",
    revalidate: 3600,
    geoField: "lat_lon",
    idField: "id",
    titleField: "title",
    bbox: false,
    defaultWhere: "date_end >= now()",
    district: {
      paris: ({ zip }) => `address_zipcode = '${zip}'`,
      montreuil: `address_zipcode = '93100'`,
    },
    columns: [
      { key: "title", label: "Titre" },
      { key: "address_city", label: "Ville" },
      { key: "address_zipcode", label: "Code postal" },
      { key: "price_type", label: "Tarif" },
      { key: "audience", label: "Public" },
    ],
  },
  works: {
    id: "chantiers-a-paris",
    title: "Chantiers",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/chantiers-a-paris/",
    revalidate: 3600,
    geoField: "geo_point_2d",
    idField: "num_emprise",
    titleField: "chantier_synthese",
    bbox: true,
    district: {
      paris: ({ zip }) => `cp_arrondissement = '${zip}'`,
    },
    columns: [
      { key: "chantier_synthese", label: "Synthèse" },
      { key: "cp_arrondissement", label: "Arrondissement" },
      { key: "chantier_categorie", label: "Catégorie" },
      { key: "date_debut", label: "Début" },
      { key: "date_fin", label: "Fin" },
    ],
  },
  street: {
    id: "dans-ma-rue",
    title: "Dans Ma Rue",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/dans-ma-rue/",
    revalidate: 3600,
    geoField: "geo_point_2d",
    idField: "id_dmr",
    titleField: "type",
    bbox: true,
    district: {
      paris: ({ n }) => `arrondissement = ${n}`,
    },
    columns: [
      { key: "type", label: "Type" },
      { key: "soustype", label: "Sous-type" },
      { key: "adresse", label: "Adresse" },
      { key: "arrondissement", label: "Arrondissement" },
      { key: "datedecl", label: "Date" },
    ],
  },
  markets: {
    id: "marches-decouverts",
    title: "Marchés découverts",
    sourceUrl: "https://opendata.paris.fr/explore/dataset/marches-decouverts/",
    revalidate: 86_400,
    geoField: "geo_point_2d",
    idField: "id_marche",
    titleField: "nom_long",
    bbox: false,
    district: {
      paris: ({ n }) => `ardt = ${n}`,
    },
    columns: [
      { key: "nom_long", label: "Marché" },
      { key: "produit", label: "Type" },
      { key: "ardt", label: "Arr." },
      { key: "jours_tenue", label: "Jours" },
      { key: "h_deb_sem_1", label: "Ouverture sem." },
      { key: "h_fin_sem_1", label: "Fermeture sem." },
    ],
  },
  montreuilTrees: {
    id: "arbres-voirie-communale",
    title: "Arbres (voirie communale)",
    sourceUrl: "https://data.montreuil.fr/explore/dataset/arbres-voirie-communale/",
    revalidate: 86_400,
    geoField: "point_geo",
    idField: "adresse_rue_square_parc_ecole_autre,nom_vernaculaire,essence",
    titleField: "nom_vernaculaire",
    bbox: false,
    host: "montreuil",
    columns: [
      { key: "nom_vernaculaire", label: "Essence" },
      { key: "essence", label: "Nom latin" },
      { key: "adresse_rue_square_parc_ecole_autre", label: "Lieu" },
      { key: "domanialite", label: "Domanialité" },
    ],
  },
  montreuilGardens: {
    id: "montreuil-est-notre-jardin",
    title: "Montreuil est notre jardin",
    sourceUrl: "https://data.montreuil.fr/explore/dataset/montreuil-est-notre-jardin/",
    revalidate: 86_400,
    geoField: "pointgeo",
    idField: "nom,adresse,annee",
    titleField: "nom",
    bbox: false,
    host: "montreuil",
    columns: [
      { key: "nom", label: "Nom" },
      { key: "categorie", label: "Catégorie" },
      { key: "adresse", label: "Adresse" },
      { key: "statut", label: "Statut" },
      { key: "annee", label: "Année" },
    ],
  },
  montreuilFountains: {
    id: "bornes-fontaines",
    title: "Bornes-fontaines",
    sourceUrl: "https://data.montreuil.fr/explore/dataset/bornes-fontaines/",
    revalidate: 86_400,
    geoField: "pointgeo",
    idField: "bornes_fontaines,type",
    titleField: "bornes_fontaines",
    bbox: false,
    host: "montreuil",
    columns: [
      { key: "bornes_fontaines", label: "Lieu" },
      { key: "type", label: "Type" },
      { key: "statut", label: "Statut" },
      { key: "gestionnaire", label: "Gestionnaire" },
    ],
  },
  montreuilMist: {
    id: "brumisateurs-dete",
    title: "Brumisateurs d’été",
    sourceUrl: "https://data.montreuil.fr/explore/dataset/brumisateurs-dete/",
    revalidate: 86_400,
    geoField: "pointgeo",
    idField: "adresse,objet,installation",
    titleField: "adresse",
    bbox: false,
    host: "montreuil",
    columns: [
      { key: "adresse", label: "Adresse" },
      { key: "objet", label: "Objet" },
      { key: "statut", label: "Statut" },
      { key: "installation", label: "Installation" },
    ],
  },
  montreuilBikes: {
    id: "comptage-des-passages-des-velos-rue-etienne-marcel",
    title: "Comptage vélos · rue Étienne Marcel",
    sourceUrl:
      "https://data.montreuil.fr/explore/dataset/comptage-des-passages-des-velos-rue-etienne-marcel/",
    revalidate: 3600,
    geoField: "",
    idField: "date",
    titleField: "date",
    bbox: false,
    host: "montreuil",
    columns: [
      { key: "date", label: "Date" },
      { key: "total", label: "Passages" },
      { key: "vers_paris", label: "Vers Paris" },
      { key: "vers_croix", label: "Vers Croix de Chavaux" },
    ],
  },
} satisfies Record<string, DatasetConfig>;

export type DatasetKey = keyof typeof DATASETS;

/** Resolve a catalog key from an Open Data dataset id (client-safe). */
export function datasetKeyById(datasetId: string): DatasetKey | undefined {
  for (const [key, dataset] of Object.entries(DATASETS) as [DatasetKey, DatasetConfig][]) {
    if (dataset.id === datasetId) return key;
  }
  return undefined;
}

export const NAV_ITEMS = [
  { href: "/dashboard", id: "overview" },
  { href: "/dashboard/montreuil", id: "montreuil" },
  { href: "/dashboard/velib", id: "velib" },
  { href: "/dashboard/nature", id: "nature" },
  { href: "/dashboard/air", id: "air" },
  { href: "/dashboard/amenities", id: "amenities" },
  { href: "/dashboard/events", id: "events" },
  { href: "/dashboard/traffic", id: "traffic" },
  { href: "/dashboard/markets", id: "markets" },
  { href: "/dashboard/favorites", id: "favorites" },
  { href: "/dashboard/alerts", id: "alerts" },
  { href: "/dashboard/profile", id: "profile" },
] as const;
