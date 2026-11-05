"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { explorerHomeHref, formatEra } from "@/lib/format";

type IconName = "list" | "card" | "plus" | "book" | "file" | "globe";

const ICON_PATHS: Record<IconName, ReactNode> = {
  list: (
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  ),
  card: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h4M7 12h10M7 16h7" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M10 13h4M10 17h4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </>
  ),
};

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

function BrandMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M2 2.5h3.2L7.5 9.5H4.3L2 2.5zm4.8 0H10L7.8 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
      { href: "/", label: "Leaderboard", icon: "list", mode: "home" },
      { href: "/#board", label: "Validators", icon: "card", mode: "validator" },
    ],
  },
  {
    title: "Nominate",
    items: [
      { href: "/nominate", label: "Build a set", icon: "plus", mode: "prefix" },
    ],
  },
  {
    title: "Reference",
    items: [
      { href: "/methodology", label: "Methodology", icon: "book", mode: "exact" },
      { href: "/contract", label: "API & contract", icon: "file", mode: "exact" },
      {
        href: explorerHomeHref(),
        label: "Polkadot explorer",
        icon: "globe",
        mode: "external",
      },
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

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 text-fg ${compact ? "" : "px-2 pt-1 pb-5"}`}
      aria-label="Vetted home"
    >
      <span className="grid h-[22px] w-[22px] place-items-center rounded-[5px] border border-line bg-panel-2 text-teal">
        <BrandMark />
      </span>
      <span className="text-[15px] font-medium tracking-[-0.01em]">vetted</span>
    </Link>
  );
}

function EraPulse({ era }: { era: number }) {
  return (
    <div
      className="inline-flex h-7 items-center gap-2 rounded-full border border-line bg-panel pr-2.5 pl-2 font-mono text-xs text-muted tabular-nums"
      title="Live era from ScoreRegistry"
    >
      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden />
      <span>
        Era <strong className="font-medium text-fg">{formatEra(era)}</strong>
      </span>
    </div>
  );
}

function NetworkLine({
  networkName,
  era,
}: {
  networkName: string;
  era: number;
}) {
  return (
    <div className="mt-auto border-t border-line px-2 pt-3">
      <div
        className="flex h-9 items-center gap-2 px-2 text-[13px] text-muted"
        title={`Era ${formatEra(era)}`}
      >
        <span
          className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-teal"
          aria-hidden
        />
        {networkName}
      </div>
    </div>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Primary">
      {SECTIONS.map((section, index) => (
        <div key={section.title} className={index === 0 ? "mt-1" : "mt-5"}>
          <div className="px-2 pb-2 text-xs leading-4 text-dim">{section.title}</div>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item);
              const className = `flex h-9 items-center gap-2.5 rounded-[8px] px-2.5 transition-colors duration-150 ${
                active
                  ? "bg-panel-2 text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-muted hover:bg-hover hover:text-fg"
              }`;
              const icon = (
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center ${active ? "text-teal" : "text-dim"}`}
                >
                  <NavIcon name={item.icon} />
                </span>
              );
              if (item.mode === "external") {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                  >
                    {icon}
                    {item.label}
                    <span className="ml-auto text-dim opacity-70">
                      <ExternalIcon />
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
                  {icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SampleDataBanner() {
  return (
    <p
      role="status"
      className="mb-5 flex items-center gap-2 rounded-[12px] border border-line bg-panel px-3 py-2 text-xs text-muted"
    >
      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-dim" aria-hidden />
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

  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      <header className="flex h-14 items-center justify-between gap-2 border-b border-line bg-nav px-3 md:hidden">
        <Logo compact />
        <div className="flex items-center gap-2">
          <EraPulse era={era} />
          <button
            type="button"
            className="btn btn-ghost px-2.5"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setMenuPath(open ? null : pathname)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>
      {open ? (
        <div id="mobile-nav" className="flex flex-col border-b border-line bg-nav px-3 py-3 md:hidden">
          <NavLinks pathname={pathname} />
          <NetworkLine networkName={networkName} era={era} />
        </div>
      ) : null}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-nav px-3 pt-5 pb-4 md:flex">
        <Logo />
        <NavLinks pathname={pathname} />
        <NetworkLine networkName={networkName} era={era} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="hidden h-14 shrink-0 items-center justify-between border-b border-line bg-bg px-7 md:flex">
          <EraPulse era={era} />
          <div className="flex items-center gap-2">
            <Link href="/methodology" className="btn btn-ghost">
              Methodology
            </Link>
            <Link href="/nominate" className="btn">
              Nominate
            </Link>
          </div>
        </header>
        <div className="w-full max-w-[1280px] flex-1 px-4 pt-7 pb-10 md:px-7">
          {sampleData ? <SampleDataBanner /> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
