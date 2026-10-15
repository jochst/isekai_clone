import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { CharacterEditor } from "@/components/sites/isekaizero-ai-0e4f18da/creation/CharacterEditor";

export const metadata: Metadata = { title: "Edit Character - ISEKAI ZERO" };

export default async function EditCharacterRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell nav="sidebar" active="creation" backdrop>
      <CharacterEditor id={id} />
    </AppShell>
  );
}
