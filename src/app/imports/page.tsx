import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ImportLibrary } from "@/components/imports/ImportLibrary";

export const metadata: Metadata = { title: "Import library - ISEKAI ZERO" };
export default function ImportsPage() {
  return <AppShell nav="sidebar" backdrop><ImportLibrary /></AppShell>;
}
