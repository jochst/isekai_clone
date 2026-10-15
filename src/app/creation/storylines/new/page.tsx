import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { StorylineEditor } from "@/components/sites/isekaizero-ai-0e4f18da/creation/StorylineEditor";

export const metadata: Metadata = { title: "Create storyline - ISEKAI ZERO" };

export default function NewStorylineRoute() {
  return (
    <AppShell nav="sidebar" active="creation" backdrop>
      <StorylineEditor />
    </AppShell>
  );
}
