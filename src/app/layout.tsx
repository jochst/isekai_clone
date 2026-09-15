import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const poppins = localFont({
  src: [
    { path: "../../public/sites/isekaizero-ai-0e4f18da/shared/fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/sites/isekaizero-ai-0e4f18da/shared/fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/sites/isekaizero-ai-0e4f18da/shared/fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const roboto = localFont({
  src: [
    { path: "../../public/sites/isekaizero-ai-0e4f18da/shared/fonts/Roboto-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../public/sites/isekaizero-ai-0e4f18da/shared/fonts/Roboto-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../public/sites/isekaizero-ai-0e4f18da/shared/fonts/Roboto-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ISEKAI ZERO - AI Roleplay & AI Story | Live Your Adventure",
  description:
    "Live the story, feel the thrill. Travel alongside your favorite characters in adventures that stir your soul.",
  icons: { icon: "/sites/isekaizero-ai-0e4f18da/shared/images/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#020920",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${roboto.variable} dark h-full antialiased`}>
      <body className="h-full overflow-hidden bg-[#020920] text-white">{children}</body>
    </html>
  );
}
