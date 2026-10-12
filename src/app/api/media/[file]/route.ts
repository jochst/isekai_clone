import { readMedia } from "@/lib/chats/media";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const media = readMedia((await params).file);
  if (!media) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(media.bytes), {
    headers: { "Content-Type": media.mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=31536000, immutable" },
  });
}
