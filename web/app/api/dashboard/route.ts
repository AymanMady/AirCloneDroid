import { phoneFetch } from "@/lib/phone";

export const dynamic = "force-dynamic";

/** Parse the phone's loose JSON (non-JSON content-type, leading whitespace). */
function safeJson(text: string): unknown {
  const s = text.trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** Fetch a phone path, tolerating slow/broken endpoints with a timeout. */
async function grab(path: string, ms: number): Promise<unknown> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  const work = (async () => {
    try {
      const res = await phoneFetch(path);
      return safeJson(await res.text());
    } catch {
      return null;
    }
  })();
  return Promise.race([work, timeout]);
}

type CallRow = { number: string; name: string; date: string; duration: string; type: string; callId: number };
type ThreadRow = { id: number; addr: string; name: string; body: string; date: number; unread: number; img: string };

export async function GET() {
  const [status, threadsRaw, contactsRaw, callsRaw, appsRaw] = await Promise.all([
    grab("/datas/device/status.xhtml", 9000),
    grab("/datas/sms/threads.xhtml", 9000),
    grab("/datas/addressBook/contacts.xhtml", 12000),
    grab("/datas/call/call_log.xhtml", 9000),
    grab("/datas/application/applications_list.xhtml", 20000),
  ]);

  // --- device status (battery / memory / wifi), from the clean status endpoint
  const st = status && typeof status === "object" && !Array.isArray(status)
    ? (status as {
        battery: { percent: number; charging: boolean } | null;
        memory: { available: string } | null;
        wifi: { name: string; strength: number; linkspeed: string } | null;
      })
    : null;
  const battery = st?.battery ?? null;
  const memory = st?.memory ?? null;
  const wifi = st?.wifi ?? null;

  // --- collections
  const threads = Array.isArray(threadsRaw) ? (threadsRaw as ThreadRow[]) : [];
  const contacts = Array.isArray(contactsRaw) ? contactsRaw : [];
  const calls = Array.isArray(callsRaw) ? (callsRaw as CallRow[]) : [];
  const apps = Array.isArray(appsRaw) ? appsRaw : [];

  const callsByType = { incoming: 0, outgoing: 0, missed: 0 };
  for (const c of calls) {
    if (c.type?.includes("missed")) callsByType.missed++;
    else if (c.type?.includes("outgoing")) callsByType.outgoing++;
    else callsByType.incoming++;
  }

  return Response.json({
    battery,
    memory,
    wifi,
    counts: {
      sms: threads.length,
      contacts: contacts.length,
      calls: calls.length,
      apps: apps.length,
    },
    callsByType,
    recentCalls: calls.slice(0, 6),
    recentSms: threads.slice(0, 6),
    appsAvailable: Array.isArray(appsRaw),
  });
}
