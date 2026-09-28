import type { Metadata } from "next";
import {
  Fraunces,
  Plus_Jakarta_Sans,
  Geist_Mono,
  Cormorant_Garamond,
  Manrope,
} from "next/font/google";
import "./globals.css";
import { MaskDefs } from "@/components/ui/MaskDefs";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { DraftRetentionSweep } from "@/components/order/DraftRetentionSweep";


const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Scoped to the "Our Products" showroom section only (Creative
// Direction spec, 2026-08-07) — not part of the site-wide type
// system above, deliberately not wired into globals.css tokens.
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TALIMOON | Personalized Children's Books",
  description:
    "Personalized storybooks that place your child at the heart of every adventure.",
  manifest: "/manifest.webmanifest",
  applicationName: "TALIMOON",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TALIMOON",
  },
  formatDetection: { telephone: false },
  icons: {
    apple: [{ url: "/pwa/apple-touch-icon-v5.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/pwa/favicon-v4-32.png",
    icon: [
      { url: "/pwa/favicon-v4-32.png", sizes: "32x32", type: "image/png" },
      { url: "/pwa/favicon-v4-48.png", sizes: "48x48", type: "image/png" },
      { url: "/pwa/prompt-logo-v4.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width" as const,
  initialScale: 1,
  themeColor: "#101A29",
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full">
      <body
  className={`${fraunces.variable} ${plusJakartaSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} ${manrope.variable} antialiased min-h-full flex flex-col`}
>
  <MaskDefs />
  <LanguageProvider>{children}<PwaInstallPrompt /><DraftRetentionSweep /></LanguageProvider>
</body>
    </html>
  );
}
