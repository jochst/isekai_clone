import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request } from "node:https";
import { MAX_IMPORT_BYTES } from "./cards";

const hosts = new Set([
  "www.isekaizero.ai", "isekaizero.ai", "api-global.isekaizero.ai", "api-us.isekaizero.ai",
  "chub.ai", "www.chub.ai", "api.chub.ai", "avatars.charhub.io", "avatars.chub.ai",
  "janitorai.com", "www.janitorai.com", "anime.gf", "www.anime.gf",
  "s3.alterworld.ai", "storage.googleapis.com",
]);
const blocked = new BlockList();
for (const [address, bits] of [["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.168.0.0", 16], ["192.0.0.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4]] as const) blocked.addSubnet(address, bits, "ipv4");
for (const [address, bits] of [["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8]] as const) blocked.addSubnet(address, bits, "ipv6");

export class SourceError extends Error {
  constructor(message: string, public retryable = false, public retryAfterMs = 0) { super(message); }
}

export function validateUrl(input: string): URL {
  let url: URL;
  try { url = new URL(input); } catch { throw new SourceError("Enter a valid HTTPS source URL."); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !hosts.has(url.hostname)) throw new SourceError("Use an HTTPS URL from Isekai Zero, Chub, JanitorAI, or anime.gf. For other sources, upload an exported JSON/PNG card.");
  url.hash = "";
  return url;
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (!family) return false;
  // BlockList also checks IPv4-mapped IPv6 addresses against IPv4 ranges.
  return !blocked.check(address, family === 4 ? "ipv4" : "ipv6");
}

export async function fetchSource(input: string, options: { method?: "GET" | "POST"; body?: string } = {}, redirects = 0): Promise<{ bytes: Buffer; contentType: string; url: string }> {
  const url = validateUrl(input);
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new SourceError("Source resolved to a private or reserved network address.");
  const target = addresses[0];
  const result = await new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; bytes: Buffer }>((resolve, reject) => {
    const req = request(url, {
      method: options.method ?? "GET", family: target.family,
      // Pin the validated DNS answer for this connection, including on redirects.
      lookup: (_hostname, _options, callback) => callback(null, target.address, target.family),
      headers: { "User-Agent": "IsekaiPersonalImporter/1.0", Accept: "application/json, text/html, image/png", "Accept-Encoding": "identity", ...(options.body ? { "Content-Type": "application/json" } : {}) },
    }, res => {
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > MAX_IMPORT_BYTES) req.destroy(new SourceError("Source response exceeds 20 MB."));
        else chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => resolve({ status: res.statusCode ?? 500, headers: res.headers, bytes: Buffer.concat(chunks) }));
    });
    const timer = setTimeout(() => req.destroy(new SourceError("Source timed out after 30 seconds.", true)), 30_000);
    req.on("close", () => clearTimeout(timer));
    req.on("error", reject);
    req.end(options.body);
  });
  if ([301, 302, 303, 307, 308].includes(result.status)) {
    if (redirects >= 3 || !result.headers.location) throw new SourceError("Too many source redirects.");
    return fetchSource(new URL(result.headers.location, url).href, result.status === 303 ? {} : options, redirects + 1);
  }
  if (result.status < 200 || result.status >= 300) {
    const retry = result.headers["retry-after"];
    const delay = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - Date.now()) : 0;
    const message = result.status === 401 || result.status === 403 ? "The source requires sign-in or has restricted this entry. Upload an export you can download from your account." : `Source returned HTTP ${result.status}.`;
    throw new SourceError(message, result.status === 429 || result.status >= 500, Math.max(0, Number.isFinite(delay) ? delay : 0));
  }
  return { bytes: result.bytes, contentType: String(result.headers["content-type"] ?? ""), url: url.href };
}
