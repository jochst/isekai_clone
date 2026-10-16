import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CharacterPage } from "@/components/sites/isekaizero-ai-0e4f18da/character/CharacterPage";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { findStoryline } from "@/lib/chats/storyline";
import { getCharacter } from "@/lib/creation/characters";
import { withImportDb } from "@/lib/imports/database";
import type { Character, CreatedCharacter, Storyline } from "@/types/isekaizero";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ story?: string }> };

/** A My Characters character (`char-…`), or a cast member of the story in `?story=`. */
async function resolve(id: string, story?: string): Promise<{ character: Character; created?: CreatedCharacter; storyline?: Storyline } | undefined> {
  if (id.startsWith("char-")) {
    const created = withImportDb((db) => getCharacter(db, id));
    return created ? { character: created.character, created } : undefined;
  }
  const storyline = story ? await findStoryline(story) : undefined;
  const character = storyline?.characters.find((c) => c.id === id);
  return character ? { character, storyline } : undefined;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const found = await resolve((await params).id, (await searchParams).story);
  return { title: found ? `${found.character.name} - ISEKAI ZERO` : "Character not found - ISEKAI ZERO" };
}

export default async function CharacterRoute({ params, searchParams }: Props) {
  const found = await resolve((await params).id, (await searchParams).story);
  if (!found) notFound();
  return (
    <AppShell nav="topbar" backdrop>
      <CharacterPage {...found} />
    </AppShell>
  );
}
