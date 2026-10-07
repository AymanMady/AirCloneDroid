/**
 * Demo mode — lets the app run without a reachable phone (e.g. on Vercel, where
 * a cloud function cannot reach a phone on a private Wi-Fi network).
 *
 * When enabled, `phoneFetch` is short-circuited to return realistic sample data
 * (bundled JSON) instead of talking to a device, so the dashboard and every
 * page are fully populated for a demo / presentation. Hardware-capture actions
 * (camera/mic/video) degrade gracefully with a clear message.
 *
 * Enabled when DEMO_MODE=1, or automatically on Vercel when no PHONE_HOST is
 * configured. Forced off with DEMO_MODE=0.
 */

import contacts from "./demo/data/contacts.json";
import smsThreads from "./demo/data/smsThreads.json";
import smsFull from "./demo/data/sms.json";
import callLog from "./demo/data/call_log.json";
import apps from "./demo/data/apps.json";
import files from "./demo/data/files.json";

export function isDemoMode(hasHost: boolean): boolean {
  if (process.env.DEMO_MODE === "1") return true;
  if (process.env.DEMO_MODE === "0") return false;
  // No device configured and running on Vercel → showcase with sample data.
  return !hasHost && !!process.env.VERCEL;
}

const STATUS = {
  battery: { percent: 82, charging: false },
  memory: { available: "1536M" },
  wifi: { name: "PFE-Demo", strength: 88, linkspeed: "72 Mbps" },
};

const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360">' +
  '<rect width="100%" height="100%" fill="#eef1f6"/>' +
  '<text x="50%" y="50%" font-family="sans-serif" font-size="22" fill="#9aa5b8" ' +
  'text-anchor="middle" dominant-baseline="middle">Photo (démo)</text></svg>';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function ok(): Response {
  return json([{ success: true }]);
}

/** Returns a synthetic Response for a phone path, or null if unmapped. */
export function demoResponse(pathWithQuery: string): Response {
  const [path, query = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(query);

  // Device status (dashboard)
  if (path.endsWith("/datas/device/status.xhtml")) return json(STATUS);

  // SMS
  if (path.endsWith("/datas/sms/threads.xhtml")) return json(smsThreads);
  if (path.endsWith("/datas/sms/show_thread.xhtml")) {
    const id = Number(params.get("threadId"));
    const thread =
      (smsFull as { threadId: number; messages: unknown[] }[]).find((t) => t.threadId === id) ??
      (smsFull as unknown[])[0];
    return json([thread]);
  }
  if (path.endsWith("/datas/sms/send_sms.xhtml")) return ok();

  // Contacts
  if (path.endsWith("/datas/addressBook/contacts.xhtml")) return json(contacts);
  if (path.endsWith("/datas/addressBook/create_contact.xhtml")) return ok();

  // Calls
  if (path.endsWith("/datas/call/call_log.xhtml")) return json(callLog);
  if (path.endsWith("/datas/call/delete_call.xhtml")) return ok();

  // Applications
  if (path.endsWith("/datas/application/applications_list.xhtml")) return json(apps);

  // Files
  if (path.endsWith("/datas/filemanagement/jqueryFileTree.xhtml")) return json(files);
  if (path.endsWith("/datas/filemanagement/filemanager.xhtml"))
    return json({ Code: 0, Error: "" });

  // Tools
  if (path.endsWith("/datas/tts/speak.xhtml")) return json({ success: true });
  if (path.endsWith("/datas/wallpaper/set.xhtml")) return json({ success: true });
  if (path.endsWith("/datas/email/send.xhtml")) return json({ success: true });
  if (path.endsWith("/datas/camera/take.xhtml"))
    return json({ success: true, file: "__demo__/photo.svg" });
  if (path.includes("/datas/mic/") || path.includes("/datas/video/"))
    return json({ success: false, error: "Capture indisponible en mode démo" });

  // Placeholder image returned for the demo camera photo.
  if (path.includes("__demo__/photo")) {
    return new Response(PLACEHOLDER_SVG, {
      status: 200,
      headers: { "content-type": "image/svg+xml", "cache-control": "no-store" },
    });
  }

  // Contact / app images and file downloads have no demo backing → 404 so the
  // UI falls back to initials / hides the broken image.
  return new Response("", { status: 404 });
}
