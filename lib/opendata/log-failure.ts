/** Uniform Open Data failure logging for API 502 paths. */
export function logOpendataFailure(context: string, cause: unknown) {
  if (cause instanceof Error) {
    console.error(`[opendata] ${context}:`, cause.message);
    return;
  }
  console.error(`[opendata] ${context}:`, cause);
}
