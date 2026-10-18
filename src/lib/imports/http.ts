import { isLocalHost, publicHosts } from "@/lib/access";
import { MAX_IMPORT_BYTES } from "./cards";

export function guardImportRequest(request: Request, mutation = false): void {
  const url = new URL(request.url);
  // Next's internal request URL can use localhost when the browser used 127.0.0.1.
  // Host is the browser-facing authority; validate it before checking Origin.
  const host = request.headers.get("host") || url.host;
  const local = isLocalHost(new URL(`http://${host}`).hostname);
  // Through the Cloudflare Tunnel the app sees http while the browser used https (X-Forwarded-Proto).
  const protocol = local ? url.protocol : `${request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")}:`;
  const browserUrl = new URL(`${protocol}//${host}`);
  // Public hostnames are only reachable after src/proxy.ts checked the Cloudflare Access login.
  if (!local && !publicHosts().includes(browserUrl.hostname)) throw new Error("The personal import API is available on localhost only.");
  if (mutation) {
    const origin = request.headers.get("origin");
    if ((origin && origin !== browserUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new Error("Cross-site import requests are not allowed.");
  }
}

/** Bound the stream before parsing JSON/multipart, including chunked requests. */
export async function boundedBody(request: Request, max = MAX_IMPORT_BYTES + 128 * 1024): Promise<Buffer> {
  if (Number(request.headers.get("content-length")) > max) throw new Error("Upload exceeds the size limit.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is required.");
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new Error("Upload exceeds the size limit."); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export function importError(error: unknown): Response {
  return Response.json({ error: error instanceof Error ? error.message : "Import request failed." }, { status: 400 });
}
