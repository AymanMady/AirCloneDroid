import { NextRequest } from "next/server";
import { phoneFetch } from "@/lib/phone";

// Always run at request time; never cache device data.
export const dynamic = "force-dynamic";

async function handle(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const target = "/" + path.map(encodeURIComponent).join("/") + req.nextUrl.search;

  const headers: Record<string, string> = {};
  let body: ArrayBuffer | null = null;
  if (req.method === "POST" || req.method === "PUT") {
    headers["Content-Type"] =
      req.headers.get("content-type") || "application/x-www-form-urlencoded";
    body = await req.arrayBuffer();
  }

  try {
    const res = await phoneFetch(target, { method: req.method, body, headers });
    const buf = Buffer.from(await res.arrayBuffer());
    const out = new Headers();
    const ct = res.headers.get("content-type");
    out.set("content-type", ct || "application/octet-stream");
    const cd = res.headers.get("content-disposition");
    if (cd) out.set("content-disposition", cd);
    out.set("cache-control", "no-store");
    return new Response(buf, { status: res.status, headers: out });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ success: false, error: msg }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
