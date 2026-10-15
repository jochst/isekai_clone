import type { Metadata } from "next";
import { RecentlyDeletedPage } from "@/components/sites/isekaizero-ai-0e4f18da/chat";

export const metadata: Metadata = { title: "Recently deleted - ISEKAI ZERO" };

export default function RecentlyDeletedRoute() {
  return <RecentlyDeletedPage />;
}
