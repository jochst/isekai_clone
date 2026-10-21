import { NextResponse } from "next/server";

import { searchStoryIds } from "@/lib/story-db";

export const dynamic = "force-dynamic";

/** GET /api/storylines/search?q=princess → { ids } of catalog stories mentioning it in the title or description. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ ids: await searchStoryIds(q.slice(0, 100)) });
}
