"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { LoadNote, NotTracked } from "@/components/data-states";
import { GradeBadge, gradeColor } from "@/components/grade-badge";
import { LeaderboardSkeleton } from "@/components/skeletons";
import { SourceBadge } from "@/components/source-badge";
import { Sparkline } from "@/components/sparkline";
import {
  ERA_POINTS_WINDOW,
  EXPLORER_URL,
  MIN_ERAS_TO_SCORE,
  SCORE_REGISTRY_ADDRESS,
  SLASH_WINDOW_ERAS,
} from "@/lib/config";
import { erasRecorded, formatEra, formatPercent, shortHex, shortSs58 } from "@/lib/format";
import type { NetworkOverview, Validator } from "@/lib/types";

type BoardStatus = "ready" | "loading" | "empty" | "error";

type QuickFilter = "all" | "a" | "active" | "clean";
type SortKey = "score" | "commission" | "slashes" | "name";

export function Leaderboard({
  status,
  overview,
  validators,
}: {
  status: BoardStatus;
  overview: NetworkOverview | null;
  validators: Validator[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [sort, setSort] = useState<SortKey>("score");

  const commissionTracked =
    overview?.stakingTracked !== false &&
    validators.every((validator) => validator.stakingTracked !== false);
  const slashesTracked = validators.every(
    (validator) => validator.stakingTracked !== false,
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return validators
      .filter((validator) => {
        if (filter === "a" && validator.grade !== "A") return false;
        if (filter === "active" && !validator.active) return false;
        if (filter === "clean" && validator.slashes > 0) return false;
        if (!needle) return true;
        const haystack = `${validator.name} ${validator.ss58} ${validator.h160}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => compareValidators(a, b, sort));
  }, [validators, query, filter, sort]);

  if (status === "loading") return <LeaderboardSkeleton />;

  const pctA =
    overview && overview.validatorsScored > 0
      ? Math.round((overview.gradedA / overview.validatorsScored) * 100)
      : null;

  return (
    <div>
      <div className="mb-[22px] mt-2.5">
        <h1>Validator report cards</h1>
      </div>
      <nav className="tabs" aria-label="Report sections">
        <Link href="/" aria-current="page">
          Leaderboard
        </Link>
        <Link href="/nominate">My nominations</Link>
        <Link href="/methodology">How scores work</Link>
      </nav>

      {status === "error" ? (
        <LoadNote message="Scores could not be loaded." action="Retry" actionHref="/" />
      ) : null}

      {status === "empty" ? (
        <LoadNote message="No validators returned." action="Retry" actionHref="/" />
      ) : null}

      {status === "ready" && overview ? (
        <>
          <div className="mb-[18px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Validators scored" value={formatEra(overview.validatorsScored)} deco={<DecoBars />} />
            <Stat
              label="Graded A"
              value={
                <>
                  {formatEra(overview.gradedA)}
                  {pctA != null ? <span className="pct">{pctA}%</span> : null}
                </>
              }
              deco={<DecoShield />}
            />
            <Stat
              label={`Slashed, last ${SLASH_WINDOW_ERAS} eras`}
              value={
                overview.stakingTracked === false ? (
                  <NotTracked />
                ) : (
                  formatEra(overview.slashedLastWindow)
                )
              }
              deco={<DecoGrid />}
            />
            <Stat label="Current era" value={formatEra(overview.era)} deco={<DecoDial />} />
          </div>

          <div className="card px-[22px] pb-1.5 pt-5" id="board">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="mr-3.5 text-[19px]">Validators</h2>
              {QUICK_FILTERS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="chip"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
              <input
                className="search sm:ml-auto"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or address"
                aria-label="Search validators"
              />
            </div>

            <p className="sr-only" aria-live="polite">
              {rows.length} validators
            </p>

            {rows.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted">
                No validators match these filters.
              </p>
            ) : (
              <>
                <ul className="space-y-3 pb-3 lg:hidden">
                  {rows.map((validator) => (
                    <li key={validator.id} className="rounded-lg border border-line p-3">
                      <div className="flex items-start justify-between gap-3">
                        <ValidatorCell validator={validator} />
                        <GradeBadge grade={validator.grade} score={validator.score} />
                      </div>
                      {validator.score == null ? (
                        <p className="mt-1 text-xs text-muted">
                          {erasRecorded(validator.activeEras, MIN_ERAS_TO_SCORE)}
                        </p>
                      ) : null}
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <dt className="text-muted">Commission</dt>
                          <dd className={`font-mono ${validator.commissionPercent > 10 ? "neg" : ""}`}>
                            {validator.stakingTracked === false ? <NotTracked /> : formatPercent(validator.commissionPercent)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">Slashes</dt>
                          <dd className={`font-mono ${validator.slashes > 0 ? "neg" : ""}`}>
                            {validator.stakingTracked === false ? <NotTracked /> : validator.slashes}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted">Era points</dt>
                          <dd>
                            <Sparkline
                              values={validator.eraPoints}
                              color={gradeColor(validator.grade)}
                              label={`${validator.name} era points, last ${ERA_POINTS_WINDOW} eras`}
                            />
                          </dd>
                        </div>
                      </dl>
                      <Link href={`/nominate?add=${validator.id}`} className="btn btn-ghost mt-3 w-full">
                        Nominate
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="table-wrap hidden lg:block">
                  <table className="data">
                    <caption className="sr-only">Validator leaderboard</caption>
                    <thead>
                      <tr>
                        <th scope="col">
                          <SortButton current={sort} value="name" onSort={setSort}>Validator</SortButton>
                        </th>
                        <th scope="col" className="text-center!">Grade</th>
                        <th scope="col" className="text-right!">
                          <SortButton current={sort} value="score" onSort={setSort}>Score</SortButton>
                        </th>
                        <th scope="col" className="text-right!">Era points, last {ERA_POINTS_WINDOW}</th>
                        <th scope="col" className="text-right!">
                          {slashesTracked ? (
                            <SortButton current={sort} value="slashes" onSort={setSort}>Slashes</SortButton>
                          ) : (
                            "Slashes"
                          )}
                        </th>
                        <th scope="col" className="text-right!">
                          {commissionTracked ? (
                            <SortButton current={sort} value="commission" onSort={setSort}>Commission</SortButton>
                          ) : (
                            "Commission"
                          )}
                        </th>
                        <th scope="col" aria-label="Open report" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((validator) => (
                        <tr key={validator.id}>
                          <td>
                            <ValidatorCell validator={validator} />
                          </td>
                          <td className="text-center">
                            <GradeBadge grade={validator.grade} score={validator.score} showScore={false} />
                          </td>
                          <td className="text-right font-mono text-[12.5px]">
                            {validator.score == null ? (
                              <span className="text-faint" title={erasRecorded(validator.activeEras, MIN_ERAS_TO_SCORE)}>
                                n/a
                              </span>
                            ) : (
                              `${validator.score}/100`
                            )}
                          </td>
                          <td className="text-right font-mono text-[12.5px]">
                            {validator.eraPoints.length < 2 ? (
                              <Untracked />
                            ) : (
                              <span className="inline-block align-middle">
                                <Sparkline
                                  values={validator.eraPoints}
                                  color={gradeColor(validator.grade)}
                                  label={`${validator.name} era points, last ${ERA_POINTS_WINDOW} eras`}
                                />
                              </span>
                            )}
                          </td>
                          <td className={`text-right font-mono text-[12.5px] ${validator.slashes > 0 && validator.stakingTracked !== false ? "neg" : ""}`}>
                            {validator.stakingTracked === false ? <Untracked /> : validator.slashes}
                          </td>
                          <td className={`text-right font-mono text-[12.5px] ${validator.commissionPercent > 10 && validator.stakingTracked !== false ? "neg" : ""}`}>
                            {validator.stakingTracked === false ? <Untracked /> : formatPercent(validator.commissionPercent)}
                          </td>
                          <td className="w-[30px] text-right">
                            <Link
                              href={`/validator/${validator.id}`}
                              className="text-lg text-dim hover:text-fg"
                              aria-label={`Open ${validator.name} report`}
                            >
                              ›
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <p className="mt-2.5 text-[12px] text-muted">Showing every active validator on Portaldot testnet.</p>

          <div className="mt-3.5 flex flex-col gap-2 rounded-lg border border-line bg-panel px-[18px] py-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              Scores are published on-chain every era to{" "}
              <b className="font-semibold text-fg">ScoreRegistry</b> ·{" "}
              <code className="font-mono text-fg" title={SCORE_REGISTRY_ADDRESS}>
                {shortHex(SCORE_REGISTRY_ADDRESS)}
              </code>
            </span>
            {EXPLORER_URL ? (
              <a
                className="link"
                href={`${EXPLORER_URL}/address/${SCORE_REGISTRY_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
              >
                View contract on explorer ↗
              </a>
            ) : (
              <Link className="link" href="/contract">
                View contract details
              </Link>
            )}
          </div>
          <p className="mt-3.5 text-[11.5px] text-[#5e6b83]">
            Data as of era {formatEra(overview.era)}. Grades update when a new score is published.
          </p>
        </>
      ) : null}
    </div>
  );
}

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "all", label: "All grades" },
  { key: "a", label: "A only" },
  { key: "active", label: "Active" },
  { key: "clean", label: "No slashes" },
];

function Untracked() {
  return <span className="font-mono text-faint">Coming next</span>;
}

function ValidatorCell({ validator }: { validator: Validator }) {
  const named = validator.hasIdentity !== false;
  return (
    <div className="flex min-w-0 items-center gap-[11px] text-fg">
      <Link
        href={`/validator/${validator.id}`}
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[13px] font-bold"
        style={{ background: avatarColor(validator.name) }}
        aria-hidden
        tabIndex={-1}
      >
        {named ? validator.name.trim().charAt(0).toUpperCase() || "?" : validator.ss58.charAt(0)}
      </Link>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <Link href={`/validator/${validator.id}`} className="text-fg">
            {named ? (
              <b className="text-[13.5px] font-semibold hover:underline">{validator.name}</b>
            ) : (
              <b className="font-mono text-[13.5px] font-semibold hover:underline" title={validator.ss58}>
                {shortSs58(validator.ss58)}
              </b>
            )}
          </Link>
          {named ? null : <CopyButton value={validator.ss58} />}
          <SourceBadge source={validator.source} />
        </span>
        <small className="block truncate font-mono text-[11.5px] text-dim">
          {named ? shortSs58(validator.ss58) : null}
          {validator.scoreTx ? (
            <span title={validator.scoreTx}>{`${named ? " · " : ""}tx ${shortHex(validator.scoreTx)}`}</span>
          ) : null}
        </small>
      </span>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="rounded border border-line px-1.5 py-px font-mono text-[10.5px] text-dim hover:text-fg"
      aria-label={`Copy address ${value}`}
      title="Copy full address"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function avatarColor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${hash % 360} 40% 30%)`;
}

function SortButton({
  current,
  value,
  onSort,
  children,
}: {
  current: SortKey;
  value: SortKey;
  onSort: (value: SortKey) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="sort-btn"
      data-on={current === value ? "true" : "false"}
      aria-pressed={current === value}
      onClick={() => onSort(value)}
    >
      {children}
      <i aria-hidden>⇅</i>
    </button>
  );
}

function Stat({ label, value, deco }: { label: string; value: ReactNode; deco: ReactNode }) {
  return (
    <div className="card stat">
      <div className="k">{label}</div>
      <div className="mt-2.5 font-mono text-[26px] font-bold tracking-[-1px]">{value}</div>
      <div className="stat-deco" aria-hidden>
        {deco}
      </div>
    </div>
  );
}

const ACCENT = "#5048F0";

function DecoBars() {
  const bars = [14, 22, 18, 32, 44];
  return (
    <svg width="64" height="48">
      {bars.map((h, i) => (
        <rect key={i} x={i * 13} y={48 - h} width="9" height={h} rx="1.5" fill={ACCENT} opacity={0.35 + i * 0.13} />
      ))}
    </svg>
  );
}

function DecoShield() {
  return (
    <svg width="56" height="56">
      <path d="M28 4 L50 12 V30 C50 42 40 50 28 54 C16 50 6 42 6 30 V12Z" fill="none" stroke={ACCENT} strokeWidth="2" opacity=".6" />
      <path d="M28 14 L42 19 V30 C42 37 36 42 28 45 C20 42 14 37 14 30 V19Z" fill={ACCENT} opacity=".35" />
    </svg>
  );
}

function DecoGrid() {
  const hot = new Set([8, 22]);
  return (
    <svg width="64" height="44">
      {Array.from({ length: 24 }, (_, i) => (
        <rect
          key={i}
          x={(i % 6) * 11}
          y={Math.floor(i / 6) * 11}
          width="8"
          height="8"
          rx="1.5"
          fill={hot.has(i) ? "#EF6B6B" : ACCENT}
          opacity={hot.has(i) ? 1 : 0.3}
        />
      ))}
    </svg>
  );
}

function DecoDial() {
  return (
    <svg width="54" height="54" viewBox="0 0 54 54">
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line
            key={i}
            x1="27"
            y1="27"
            x2={(27 + 24 * Math.cos(a)).toFixed(2)}
            y2={(27 + 24 * Math.sin(a)).toFixed(2)}
            stroke={ACCENT}
            strokeWidth="3"
            opacity={0.25 + i * 0.06}
          />
        );
      })}
    </svg>
  );
}

function compareValidators(a: Validator, b: Validator, sort: SortKey): number {
  if (sort === "name") return a.name.localeCompare(b.name);
  if (sort === "commission") {
    return a.commissionPercent - b.commissionPercent || a.name.localeCompare(b.name);
  }
  if (sort === "slashes") {
    return b.slashes - a.slashes || a.name.localeCompare(b.name);
  }
  const aScore = a.score ?? -1;
  const bScore = b.score ?? -1;
  return bScore - aScore || a.name.localeCompare(b.name);
}
