import { recordId, type GeoPoint, type OpenDataRecord } from "@/lib/opendata/client";

export type MapMarker = {
  id: string;
  position: GeoPoint;
  label: string;
  color?: string;
  description?: string;
};

export function recordsToMarkers(
  records: OpenDataRecord[],
  options: {
    idField: string;
    titleField: string;
    geoField: string;
    color?: (record: OpenDataRecord) => string;
    description?: (record: OpenDataRecord) => string;
  },
): MapMarker[] {
  return records.flatMap((record, index) => {
    const geo = record[options.geoField];
    if (!geo || typeof geo !== "object") return [];
    const point = geo as { lat?: unknown; lon?: unknown; lng?: unknown };
    const lat = Number(point.lat);
    const lon = Number(point.lon ?? point.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    if (lat === 0 && lon === 0) return [];
    const baseId = recordId(record, options.idField) || `${lat}-${lon}`;
    return [
      {
        id: `${baseId}::${index}`,
        position: { lat, lon },
        label: String(record[options.titleField] ?? "Point"),
        color: options.color?.(record),
        description: options.description?.(record),
      },
    ];
  });
}
