import type { Metadata } from "next";
import { AppShell } from "@/components/sites/isekaizero-ai-0e4f18da/shared";
import { ProfilePage } from "@/components/sites/isekaizero-ai-0e4f18da/profile/ProfilePage";

export const metadata: Metadata = { title: "Profile - ISEKAI ZERO" };

export default function ProfileRoute() {
  return (
    <AppShell nav="sidebar" active="profile" backdrop>
      <ProfilePage />
    </AppShell>
  );
}
