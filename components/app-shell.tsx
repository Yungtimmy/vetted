"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { formatEra } from "@/lib/format";

const NAV = [
  { href: "/", label: "Leaderboard", mode: "home" },
  { href: "/#board", label: "Validators", mode: "validator" },
  { href: "/nominate", label: "Nominate", mode: "prefix" },
  { href: "/methodology", label: "Methodology", mode: "exact" },
  { href: "/contract", label: "API & contract", mode: "exact" },
] as const;

type NavItem = (typeof NAV)[number];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.mode === "home") return pathname === "/";
  if (item.mode === "validator") return pathname.startsWith("/validator");
  if (item.mode === "prefix") return pathname.startsWith(item.href);
  return pathname === item.href;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-fg ${compact ? "" : "mb-7"}`}
    >
      <span
        className="grid h-[26px] w-[26px] place-items-center rounded-full border-2 border-teal text-sm leading-none text-teal"
        aria-hidden
      >
        ✓
      </span>
      <span className="font-display text-[22px] font-bold tracking-tight">
        vetted
      </span>
    </Link>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Primary">
      {NAV.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-lg bg-panel-2 px-3 py-[9px] text-fg"
                : "rounded-lg px-3 py-[9px] text-muted hover:text-fg"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NetworkCard({
  networkName,
  era,
  sampleData,
}: {
  networkName: string;
  era: number;
  sampleData: boolean;
}) {
  return (
    <div className="mt-8 rounded-lg border border-line p-2.5 text-xs text-muted">
      <div className="flex items-center">
        <span
          className={`mr-1.5 inline-block h-[7px] w-[7px] rounded-full ${sampleData ? "bg-grade-c" : "bg-grade-a"}`}
          aria-hidden
        />
        {networkName}
      </div>
      <div className="mt-1 font-mono">
        Era {formatEra(era)} · scores on-chain
      </div>
    </div>
  );
}

function SampleDataBanner() {
  return (
    <p
      role="status"
      className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-xs text-fg"
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-grade-c"
        aria-hidden
      />
      Testnet not connected — showing sample data
    </p>
  );
}

export function AppShell({
  networkName,
  era,
  sampleData,
  children,
}: {
  networkName: string;
  era: number;
  sampleData: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_minmax(0,1fr)]">
      <header className="flex items-center justify-between border-b border-line bg-nav px-4 py-3 md:hidden">
        <Logo compact />
        <button
          type="button"
          className="chip"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setMenuPath(open ? null : pathname)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open ? (
        <div
          id="mobile-nav"
          className="border-b border-line bg-nav px-3.5 py-3 md:hidden"
        >
          <NavLinks pathname={pathname} />
          <NetworkCard
            networkName={networkName}
            era={era}
            sampleData={sampleData}
          />
        </div>
      ) : null}
      <aside className="hidden border-r border-line bg-nav px-3.5 py-5 md:block">
        <Logo />
        <NavLinks pathname={pathname} />
        <NetworkCard
          networkName={networkName}
          era={era}
          sampleData={sampleData}
        />
      </aside>
      <main className="min-w-0 px-4 py-5 md:px-7 md:py-6">
        {sampleData ? <SampleDataBanner /> : null}
        {children}
      </main>
    </div>
  );
}
