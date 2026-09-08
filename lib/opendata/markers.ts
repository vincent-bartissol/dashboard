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
    const point = geo as { lat?: number; lon?: number };
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return [];
    if (point.lat === 0 && point.lon === 0) return [];
    const baseId = recordId(record, options.idField) || `${point.lat}-${point.lon}`;
    return [
      {
        id: `${baseId}::${index}`,
        position: { lat: Number(point.lat), lon: Number(point.lon) },
        label: String(record[options.titleField] ?? "Point"),
        color: options.color?.(record),
        description: options.description?.(record),
      },
    ];
  });
}
