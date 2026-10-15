import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { StorylineEditor } from "@/components/sites/isekaizero-ai-0e4f18da/creation/StorylineEditor";

export const metadata: Metadata = { title: "Edit Story - ISEKAI ZERO" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };

export default async function EditStorylineRoute({ params, searchParams }: Props) {
  const { id } = await params;
  const { from } = await searchParams;
  // Only an in-app chat path is accepted as the way back.
  const returnTo = from && /^\/chats\/[\w-]+$/.test(from) ? from : undefined;
  return (
    <AppShell nav="sidebar" active="creation" backdrop>
      <StorylineEditor id={id} returnTo={returnTo} />
    </AppShell>
  );
}
