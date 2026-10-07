/**
 * Server-side bridge to the phone's native device API.
 *
 * The phone (PAW server inside the APK) exposes JSON endpoints protected by a
 * PIN/cookie session. This module logs in once with the configured PIN, keeps
 * the `mrd_auth` cookie, and proxies authenticated requests. It is the backend
 * half of the Next.js app — the browser never talks to the phone directly.
 */
import fs from "fs";
import path from "path";

export type PhoneConfig = { host: string; port: number; pin: string };

const CONFIG_PATH = path.join(process.cwd(), ".phone-config.json");

let config: PhoneConfig | null = null;
let sessionCookie: string | null = null;

function load(): PhoneConfig {
  if (config) return config;
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    config = {
      host: process.env.PHONE_HOST || "",
      port: parseInt(process.env.PHONE_PORT || "7575", 10),
      pin: process.env.PHONE_PIN || "",
    };
  }
  return config!;
}

export function getConfig(): PhoneConfig {
  return load();
}

export function setConfig(c: PhoneConfig) {
  config = { host: c.host.trim(), port: Number(c.port) || 7575, pin: c.pin };
  sessionCookie = null; // force a fresh login
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function baseUrl(): string {
  const c = load();
  return `http://${c.host}:${c.port}`;
}

async function login(): Promise<void> {
  const c = load();
  if (!c.host) throw new Error("Téléphone non configuré");
  const res = await fetch(`${baseUrl()}/login.xhtml`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ pin: c.pin }).toString(),
    redirect: "manual",
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  sessionCookie = null;
  for (const sc of cookies) {
    const m = sc.match(/mrd_auth=([^;]+)/);
    if (m) sessionCookie = `mrd_auth=${m[1]}`;
  }
  if (!sessionCookie) {
    throw new Error("Connexion refusée (code PIN incorrect ?)");
  }
}

/** Authenticated request to a phone path like "/datas/sms/threads.xhtml". */
export async function phoneFetch(
  pathPart: string,
  init: { method?: string; body?: string | null; headers?: Record<string, string> } = {}
): Promise<Response> {
  const c = load();
  if (!c.host) throw new Error("Téléphone non configuré");
  if (!sessionCookie) await login();

  const doFetch = () =>
    fetch(`${baseUrl()}${pathPart}`, {
      method: init.method || "GET",
      body: init.body ?? null,
      headers: {
        ...(init.headers || {}),
        "X-Requested-With": "XMLHttpRequest",
        Cookie: sessionCookie!,
      },
      redirect: "manual",
    });

  let res = await doFetch();
  if (res.status === 401 || res.status === 302) {
    await login();
    res = await doFetch();
  }
  return res;
}

export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    sessionCookie = null;
    await login();
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
