import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { CURRENT_ERA, NETWORK_NAME, RPC_CONFIGURED } from "@/lib/config";
import { getDataProvider } from "@/lib/data";
import "./globals.css";

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vetted",
    template: "%s · Vetted",
  },
  description:
    "Validator risk report cards for the Portaldot network. Scores are published on-chain every era.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const overview = await getDataProvider()
    .getOverview()
    .catch(() => ({ name: NETWORK_NAME, era: CURRENT_ERA }));

  return (
    <html
      lang="en"
      className={`${space.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-fg">
        <AppShell
          networkName={overview.name}
          era={overview.era}
          sampleData={!RPC_CONFIGURED}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
