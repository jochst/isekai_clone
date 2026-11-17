import { guardImportRequest, boundedBody } from "@/lib/imports/http";
import { deleteSavedKey, listSavedKeys, setSavedKey } from "@/lib/keys/store";
import { ENV_KEYS, envKey, isProviderKeyName } from "@/lib/sites/isekaizero-ai-0e4f18da/provider-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export interface ServerKeyStatus {
  /** "saved": typed into Settings and stored encrypted on the server; "env": from .env.local. */
  source: "saved" | "env";
  /** Last four characters of a saved key. */
  hint?: string;
  updated?: number;
}

export interface ServerKeysResponse {
  /** Which providers have a key on the server (saved or .env.local). */
  keys: Record<string, boolean>;
  status: Record<string, ServerKeyStatus | null>;
}

function snapshot(): ServerKeysResponse {
  const saved = listSavedKeys();
  const status = Object.fromEntries(
    Object.keys(ENV_KEYS).map((name): [string, ServerKeyStatus | null] => {
      const s = saved[name];
      if (s) return [name, { source: "saved", hint: s.hint, updated: s.updated }];
      return [name, envKey(name as keyof typeof ENV_KEYS) ? { source: "env" } : null];
    }),
  );
  const keys = Object.fromEntries(Object.entries(status).map(([name, s]) => [name, s !== null]));
  return { keys, status };
}

function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status, headers: NO_STORE });
}

/** Which providers have a key on the server, and where it comes from. Never returns the keys themselves. */
export function GET() {
  return Response.json(snapshot(), { headers: NO_STORE });
}

/** Save (or replace) a provider key: `{ name, key }`. */
export async function PUT(request: Request) {
  try {
    guardImportRequest(request, true);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.", 403);
  }
  let body: { name?: string; key?: string };
  try {
    body = JSON.parse((await boundedBody(request, 8 * 1024)).toString("utf8")) as { name?: string; key?: string };
  } catch {
    return fail("Invalid JSON body.");
  }
  const name = (body.name ?? "").trim();
  const key = (body.key ?? "").trim();
  if (!isProviderKeyName(name)) return fail("Unknown provider.");
  if (!key) return fail("Enter a key.");
  if (key.length > 1024 || /\s/.test(key)) return fail("That doesn't look like an API key.");
  setSavedKey(name, key);
  return Response.json(snapshot(), { headers: NO_STORE });
}

/** Remove a saved key (`?name=elevenlabs`). A key in .env.local, if any, takes over again. */
export function DELETE(request: Request) {
  try {
    guardImportRequest(request, true);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.", 403);
  }
  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!isProviderKeyName(name)) return fail("Unknown provider.");
  deleteSavedKey(name);
  return Response.json(snapshot(), { headers: NO_STORE });
}
