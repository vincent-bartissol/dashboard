export function DatasetNotice({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p role="status" className="text-sm text-accent">
      Les données Open Data sont indisponibles pour le moment. Les chiffres affichés peuvent être
      incomplets.
    </p>
  );
}
