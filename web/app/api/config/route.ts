import { getConfig, setConfig, testConnection, isDemo } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET() {
  const demo = isDemo();
  if (demo) {
    return Response.json({
      host: "Démonstration",
      port: 7575,
      pinSet: true,
      connected: true,
      demo: true,
    });
  }
  const c = getConfig();
  const status = c.host ? await testConnection() : { ok: false as const };
  return Response.json({
    host: c.host,
    port: c.port,
    pinSet: !!c.pin,
    connected: status.ok,
    demo: false,
    error: "error" in status ? status.error : undefined,
  });
}

export async function POST(req: Request) {
  if (isDemo()) {
    // No device to configure in demo mode.
    return Response.json({ ok: true, demo: true });
  }
  const { host, port, pin } = await req.json();
  setConfig({ host: String(host || ""), port: Number(port) || 7575, pin: String(pin || "") });
  const status = await testConnection();
  return Response.json({ ok: status.ok, error: status.error });
}
