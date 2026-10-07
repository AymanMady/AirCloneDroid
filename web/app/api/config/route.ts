import { getConfig, setConfig, testConnection } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = getConfig();
  const status = c.host ? await testConnection() : { ok: false as const };
  return Response.json({
    host: c.host,
    port: c.port,
    pinSet: !!c.pin,
    connected: status.ok,
    error: "error" in status ? status.error : undefined,
  });
}

export async function POST(req: Request) {
  const { host, port, pin } = await req.json();
  setConfig({ host: String(host || ""), port: Number(port) || 7575, pin: String(pin || "") });
  const status = await testConnection();
  return Response.json({ ok: status.ok, error: status.error });
}
