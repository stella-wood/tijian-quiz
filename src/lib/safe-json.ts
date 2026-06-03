/**
 * Safely parse JSON. Returns the parsed value on success, fallback on failure.
 * Prevents page crashes from malformed JSON in the database.
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
