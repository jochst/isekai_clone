import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { CharacterEditor } from "@/components/sites/isekaizero-ai-0e4f18da/creation/CharacterEditor";

export const metadata: Metadata = { title: "Create character - ISEKAI ZERO" };

export default function NewCharacterRoute() {
  return (
    <AppShell nav="sidebar" active="creation" backdrop>
      <CharacterEditor />
    </AppShell>
  );
}
