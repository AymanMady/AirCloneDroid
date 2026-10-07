/**
 * Client-side helpers. The browser only ever calls our own /api/phone proxy,
 * which authenticates and forwards to the phone. The phone returns JSON with a
 * non-JSON content type (and sometimes blank bodies), so we parse defensively.
 */

export type Ok = { success: boolean; error?: string; file?: string };

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  const trimmed = text.trim();
  if (trimmed === "") return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}

export async function phoneGet(path: string): Promise<unknown> {
  const res = await fetch("/api/phone" + path, { cache: "no-store" });
  return parse(res);
}

export async function phonePost(
  path: string,
  data: Record<string, string>
): Promise<unknown> {
  const res = await fetch("/api/phone" + path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(data).toString(),
    cache: "no-store",
  });
  return parse(res);
}

/** Absolute URL (through the proxy) for an image/file served by the phone. */
export function phoneAsset(path: string): string {
  const clean = path.startsWith("/") ? path : "/" + path;
  return "/api/phone" + clean;
}

/** The phone returns either {success} or [{success}]; normalise both. */
export function okOf(res: unknown): Ok {
  const o = Array.isArray(res) ? res[0] : res;
  if (o && typeof o === "object") return o as Ok;
  return { success: false, error: "Réponse vide du téléphone" };
}

export function asArray<T = Record<string, unknown>>(res: unknown): T[] {
  return Array.isArray(res) ? (res as T[]) : [];
}
