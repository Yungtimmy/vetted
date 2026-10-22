"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { EXPLORER_URL } from "@/lib/config";
import { formatEra } from "@/lib/format";

type IconName = "bars" | "box" | "plus" | "doc" | "code" | "ext";

const ICON_PATHS: Record<IconName, ReactNode> = {
  bars: <path d="M2 13h12M4 13V8M8 13V4M12 13V6" />,
  box: (
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      <path d="M5 8h6" />
    </>
  ),
  plus: <path d="M8 2v12M2 8h12" />,
  doc: <path d="M3 2h7l3 3v9H3z" />,
  code: <path d="M6 4L2 8l4 4M10 4l4 4-4 4" />,
  ext: <path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" />,
};

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  mode: "home" | "validator" | "prefix" | "exact" | "external";
};

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Report cards",
    items: [
      { href: "/", label: "Leaderboard", icon: "bars", mode: "home" },
      { href: "/#board", label: "Validators", icon: "box", mode: "validator" },
      { href: "/nominate", label: "Nominate", icon: "plus", mode: "prefix" },
    ],
  },
  {
    title: "Reference",
    items: [
      { href: "/methodology", label: "Methodology", icon: "doc", mode: "exact" },
      { href: "/contract", label: "API & contract", icon: "code", mode: "exact" },
      ...(EXPLORER_URL
        ? [
            {
              href: EXPLORER_URL,
              label: "Portaldot explorer",
              icon: "ext" as const,
              mode: "external" as const,
            },
          ]
        : []),
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.mode === "home") return pathname === "/";
  if (item.mode === "validator") return pathname.startsWith("/validator");
  if (item.mode === "prefix") return pathname.startsWith(item.href);
  if (item.mode === "external") return false;
  return pathname === item.href;
}

/** The approved seal mark (icon-b.svg), drawn inline so it inherits no background. */
export function SealMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path d="M22 6 H78 L94 22 V78 L78 94 H22 L6 78 V22 Z" fill="#5048F0" />
      <path d="M26 28 H40 L52 62 L46 78 Z" fill="#0A1628" />
      <path d="M60 28 H74 L56 78 H48 Z" fill="#E8ECF4" />
      <rect x="6" y="46" width="6" height="8" fill="#0A1628" />
      <rect x="88" y="46" width="6" height="8" fill="#0A1628" />
    </svg>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-[9px] text-fg ${compact ? "" : "mx-1.5 mb-[26px]"}`}
      aria-label="Vetted home"
    >
      <SealMark />
      <span className="text-[21px] font-bold tracking-[-0.8px]">vetted</span>
    </Link>
  );
}

function NavLinks({
  pathname,
  networkName,
  era,
  sampleData,
}: {
  pathname: string;
  networkName: string;
  era: number;
  sampleData: boolean;
}) {
  return (
    <nav aria-label="Primary">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="mx-2 mb-2 mt-[18px] text-[11.5px] text-dim">
            {section.title}
          </div>
          {section.items.map((item) => {
            const active = isActive(pathname, item);
            const className = `mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 ${
              active ? "bg-teal text-fg" : "text-nav-fg hover:bg-panel-2"
            }`;
            if (item.mode === "external") {
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={className}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                  <span className="ml-auto opacity-60" aria-hidden>
                    ↗
                  </span>
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="mx-2 mb-2 mt-[18px] text-[11.5px] text-dim">Network</div>
      <div
        className="flex items-center gap-2.5 px-2.5 py-2 text-nav-fg"
        title={`Era ${formatEra(era)}`}
      >
        <span
          className={`mx-1 inline-block h-[7px] w-[7px] rounded-full ${sampleData ? "bg-grade-c" : "bg-grade-a"}`}
          aria-hidden
        />
        {networkName}
      </div>
    </nav>
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
      Testnet not connected, showing sample data
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
  const navProps = { pathname, networkName, era, sampleData };

  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
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
        <div id="mobile-nav" className="border-b border-line bg-nav px-3.5 py-3 md:hidden">
          <NavLinks {...navProps} />
        </div>
      ) : null}
      <aside className="hidden border-r border-line bg-nav md:block">
        <div className="sticky top-0 px-3.5 py-[18px]">
          <Logo />
          <NavLinks {...navProps} />
        </div>
      </aside>
      <main className="min-w-0 px-4 pb-[30px] md:px-9">
        <div className="hidden h-[58px] items-center justify-end gap-2 md:flex">
          <Link href="/methodology" className="btn btn-ghost">
            Methodology
          </Link>
          <Link href="/nominate" className="btn">
            Nominate safely
          </Link>
        </div>
        <div className="pt-5 md:pt-0">
          {sampleData ? <SampleDataBanner /> : null}
          {children}
        </div>
      </main>
    </div>
  );
}
