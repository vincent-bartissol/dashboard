import type { DatasetConfig } from "./client";

export const ARRONDISSEMENTS = [
  { code: "01", label: "1er", zip: "75001" },
  { code: "02", label: "2e", zip: "75002" },
  { code: "03", label: "3e", zip: "75003" },
  { code: "04", label: "4e", zip: "75004" },
  { code: "05", label: "5e", zip: "75005" },
  { code: "06", label: "6e", zip: "75006" },
  { code: "07", label: "7e", zip: "75007" },
  { code: "08", label: "8e", zip: "75008" },
  { code: "09", label: "9e", zip: "75009" },
  { code: "10", label: "10e", zip: "75010" },
  { code: "11", label: "11e", zip: "75011" },
  { code: "12", label: "12e", zip: "75012" },
  { code: "13", label: "13e", zip: "75013" },
  { code: "14", label: "14e", zip: "75014" },
  { code: "15", label: "15e", zip: "75015" },
  { code: "16", label: "16e", zip: "75016" },
  { code: "17", label: "17e", zip: "75017" },
  { code: "18", label: "18e", zip: "75018" },
  { code: "19", label: "19e", zip: "75019" },
  { code: "20", label: "20e", zip: "75020" },
] as const;

export type ArrondissementCode = (typeof ARRONDISSEMENTS)[number]["code"];

function ordinalLabel(code: string) {
  const n = Number(code);
  if (n === 1) return "1ER";
  return `${n}E`;
}

export type PreferredDistrict = ArrondissementCode | "montreuil";

export function parsePreferredDistrict(
  value: string | null | undefined,
): { ok: true; value: PreferredDistrict | null } | { ok: false } {
  if (value == null || value === "") return { ok: true, value: null };
  if (value === "montreuil") return { ok: true, value: "montreuil" };
  if (ARRONDISSEMENTS.some((item) => item.code === value)) {
    return { ok: true, value: value as ArrondissementCode };
  }
  return { ok: false };
}

export function arrondissementWhere(dataset: DatasetConfig, code?: string | null) {
  if (!code || !dataset.district) return undefined;
  if (code === "montreuil") return dataset.district.montreuil;
  const padded = code.padStart(2, "0");
  const n = Number(padded);
  if (!Number.isFinite(n) || n < 1 || n > 20) return undefined;
  return dataset.district.paris?.({
    code: padded,
    zip: `750${padded}`,
    ordinal: ordinalLabel(padded),
    n,
  });
}

export function arrondissementLabel(code?: string | null) {
  if (!code) return "Toute Paris";
  if (code === "montreuil") return "Montreuil · Robespierre";
  const found = ARRONDISSEMENTS.find((item) => item.code === code);
  return found ? `${found.label} arrondissement` : "Toute Paris";
}
