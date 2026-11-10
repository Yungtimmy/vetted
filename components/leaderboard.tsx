"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { LoadNote } from "@/components/data-states";
import { GradeBadge } from "@/components/grade-badge";
import { LeaderboardSkeleton } from "@/components/skeletons";
import { SourceBadge } from "@/components/source-badge";
import { TextLink } from "@/components/text-link";
import { MIN_ERAS_TO_SCORE, SCORE_REGISTRY_ADDRESS } from "@/lib/config";
import {
  erasRecorded,
  explorerTxHref,
  formatEra,
  shortHex,
  shortSs58,
} from "@/lib/format";
import type { NetworkOverview, Validator } from "@/lib/types";

type BoardStatus = "ready" | "loading" | "empty" | "error";
type GradeFilter = "all" | "a" | "bplus";

const GRADE_FILTERS: { key: GradeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "a", label: "A" },
  { key: "bplus", label: "B+" },
];

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
  const [filter, setFilter] = useState<GradeFilter>("all");

  const ranked = useMemo(
    () => [...validators].sort(compareValidators),
    [validators],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ranked.filter((validator) => {
      if (filter === "a" && validator.grade !== "A") return false;
      if (filter === "bplus" && validator.grade !== "A" && validator.grade !== "B") {
        return false;
      }
      if (!needle) return true;
      const haystack = `${validator.name} ${validator.ss58} ${validator.h160}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [ranked, query, filter]);

  if (status === "loading") return <LeaderboardSkeleton />;

  const pctA =
    overview && overview.validatorsScored > 0
      ? Math.round((overview.gradedA / overview.validatorsScored) * 100)
      : null;
  const published = ranked.filter((validator) => validator.scoreBlock != null);

  return (
    <div>
      <div className="mb-6">
        <h1>Leaderboard</h1>
        <p className="mt-2 max-w-[44rem] text-sm leading-5 text-muted">
          On-chain grades for Portaldot validators. Stake with a published score, not a feeling.
        </p>
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
          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Snapshot">
            <Fact
              label="Validators scored"
              value={formatEra(overview.validatorsScored)}
              meta="Active set on testnet"
            />
            <Fact
              label="Graded A"
              value={formatEra(overview.gradedA)}
              meta={
                pctA != null ? (
                  <>
                    <span className="text-grade-a">{pctA}%</span> of scored set
                  </>
                ) : (
                  "—"
                )
              }
            />
            <Fact
              label="Current era"
              value={formatEra(overview.era)}
              meta={eraMeta(overview)}
            />
          </section>

          <section className="overflow-hidden rounded-[12px] border border-line bg-panel" id="board" aria-label="Validators">
            <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[13px] font-medium tracking-normal text-fg">
                Validators
                <span className="ml-2 font-mono text-xs font-normal text-dim tabular-nums">
                  {rows.length}
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex h-8 items-center rounded-[8px] border border-line bg-panel-2 p-0.5"
                  role="group"
                  aria-label="Grade filter"
                >
                  {GRADE_FILTERS.map((item) => {
                    const selected = filter === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        aria-pressed={selected}
                        className={`h-[26px] rounded-[6px] px-2.5 text-xs font-medium transition-colors duration-150 ${
                          selected
                            ? "bg-panel text-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                            : "text-dim hover:text-muted"
                        }`}
                        onClick={() => setFilter(item.key)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <label className="flex h-8 w-full items-center gap-2 rounded-[8px] border border-line bg-panel-2 px-2.5 sm:w-[220px]">
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-dim"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3-3" />
                  </svg>
                  <input
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-dim"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                    aria-label="Search name or address"
                  />
                </label>
              </div>
            </div>

            <p className="sr-only" aria-live="polite">
              {rows.length} validators
            </p>

            {rows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-dim">
                No validators match these filters.
              </p>
            ) : (
              <>
                <ul className="lg:hidden">
                  {rows.map((validator) => (
                    <li key={validator.id} className="border-b border-line px-4 py-3 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                        <ValidatorIdentity validator={validator} />
                        <GradeBadge grade={validator.grade} score={validator.score} showScore={false} />
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <ScoreFigure score={validator.score} eras={validator.activeEras} />
                        <div className="min-w-0 flex-1">
                          <ScoreBar score={validator.score} />
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <SlashCell validator={validator} />
                        <OpenLink validator={validator} />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="table-wrap hidden lg:block">
                  <table className="data">
                    <caption className="sr-only">Validator leaderboard</caption>
                    <thead>
                      <tr>
                        <th scope="col">Validator</th>
                        <th scope="col">Grade</th>
                        <th scope="col" className="text-right">
                          Score
                        </th>
                        <th scope="col">Published score</th>
                        <th scope="col">Slashes</th>
                        <th scope="col">
                          <span className="sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((validator) => (
                        <tr key={validator.id}>
                          <td>
                            <ValidatorIdentity validator={validator} />
                          </td>
                          <td>
                            <GradeBadge
                              grade={validator.grade}
                              score={validator.score}
                              showScore={false}
                            />
                          </td>
                          <td className="text-right">
                            <ScoreFigure score={validator.score} eras={validator.activeEras} />
                          </td>
                          <td>
                            <ScoreBar score={validator.score} />
                          </td>
                          <td>
                            <SlashCell validator={validator} />
                          </td>
                          <td className="text-right">
                            <OpenLink validator={validator} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 border-t border-line bg-nav px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-4 text-dim">
                Scores publish every era to{" "}
                <code
                  className="font-mono text-[11px] text-muted"
                  title={SCORE_REGISTRY_ADDRESS}
                >
                  ScoreRegistry · {shortHex(SCORE_REGISTRY_ADDRESS)}
                </code>
              </p>
              <p className="text-xs leading-4 text-dim">
                {published.map((validator, index) => (
                  <span key={validator.id}>
                    {index > 0 ? " · " : null}
                    <TextLink
                      href={explorerTxHref(validator.scoreTx, validator.scoreBlock)}
                      className="text-muted transition-colors duration-150 hover:text-teal"
                    >
                      {verifyLabel(index, published.length)}
                    </TextLink>
                  </span>
                ))}
                {published.length > 0 ? " · " : null}
                <Link
                  href="/contract#verify"
                  className="text-muted transition-colors duration-150 hover:text-teal"
                >
                  ScoreRegistry
                </Link>
              </p>
            </div>
          </section>

          <p className="mt-4 text-xs leading-4 text-dim">
            Data as of era {formatEra(overview.era)}. Grades update when a new score is
            published.
            {overview.stakingTracked === false
              ? " Staking fields could not be read from Substrate."
              : " Commission, self-stake, and era points are read from Substrate. Chill events are not available on this chain."}
          </p>
        </>
      ) : null}
    </div>
  );
}

function Fact({
  label,
  value,
  meta,
}: {
  label: string;
  value: ReactNode;
  meta: ReactNode;
}) {
  return (
    <div className="min-h-[84px] rounded-[12px] border border-line bg-panel px-[18px] py-4">
      <p className="mb-2 text-xs leading-4 text-dim">{label}</p>
      <p className="font-mono text-[28px] leading-none font-medium tracking-[-0.02em] tabular-nums">
        {value}
      </p>
      <p className="mt-2 font-mono text-xs leading-4 text-dim">{meta}</p>
    </div>
  );
}

function eraMeta(overview: NetworkOverview): string {
  if (overview.stakingTracked === false) return "No slash data yet";
  if (overview.slashedLastWindow === 0) return "No slashes in this window";
  return `${formatEra(overview.slashedLastWindow)} slashed`;
}

function ScoreFigure({ score, eras }: { score: number | null; eras: number }) {
  if (score == null) {
    return (
      <span
        className="font-mono text-[13px] text-dim"
        title={erasRecorded(eras, MIN_ERAS_TO_SCORE)}
      >
        n/a
      </span>
    );
  }
  return (
    <span className="font-mono text-[13px] font-medium text-fg tabular-nums">
      {score}
      <span className="font-normal text-dim">/100</span>
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  const width = score == null ? 0 : Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 min-w-16 flex-1 overflow-hidden rounded-[2px] bg-panel-2" aria-hidden>
        <div className="h-full rounded-[2px] bg-teal" style={{ width: `${width}%` }} />
      </div>
      <span className="w-7 shrink-0 font-mono text-[11px] text-dim tabular-nums">
        {score == null ? "—" : score}
      </span>
    </div>
  );
}

function SlashCell({ validator }: { validator: Validator }) {
  if (validator.stakingTracked === false) {
    return <span className="text-xs text-dim">No slash data yet</span>;
  }
  return (
    <span className={`font-mono text-[13px] tabular-nums ${validator.slashes > 0 ? "neg" : "text-fg"}`}>
      {validator.slashes}
    </span>
  );
}

function OpenLink({ validator }: { validator: Validator }) {
  return (
    <Link
      href={`/validator/${validator.id}`}
      className="text-[13px] font-medium text-muted transition-colors duration-150 hover:text-teal"
      aria-label={`Open ${validator.name} report`}
    >
      Open
    </Link>
  );
}

function ValidatorIdentity({ validator }: { validator: Validator }) {
  const named = validator.hasIdentity !== false;
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/validator/${validator.id}`}
          className={
            named
              ? "text-[13px] font-medium text-fg"
              : "font-mono text-[13px] font-medium text-fg tabular-nums"
          }
          title={validator.ss58}
        >
          {named ? validator.name : shortSs58(validator.ss58)}
        </Link>
        <CopyButton value={validator.ss58} />
        <SourceBadge source={validator.source} />
      </div>
      <div className="mt-1 truncate font-mono text-[11px] leading-[14px] text-dim">
        {named ? <span>{shortSs58(validator.ss58)}</span> : null}
        {validator.scoreTx ? (
          <span title={validator.scoreTx}>
            {named ? " · " : ""}tx {shortHex(validator.scoreTx)}
          </span>
        ) : null}
        {validator.scoreBlock != null ? (
          <span> · block {formatEra(validator.scoreBlock)}</span>
        ) : null}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="grid h-6 w-6 place-items-center rounded-[6px] text-dim transition-colors duration-150 hover:bg-panel-2 hover:text-fg"
      aria-label={copied ? "Copied address" : "Copy address"}
      title={copied ? "Copied" : "Copy full address"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M5 12l5 5L20 7" />
        </svg>
      ) : (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      )}
    </button>
  );
}

function verifyLabel(index: number, total: number): string {
  if (total === 1) return "Verify";
  if (index === 0) return "Verify first";
  if (index === 1) return "Verify second";
  return `Verify ${index + 1}`;
}

function compareValidators(a: Validator, b: Validator): number {
  const aScore = a.score ?? -1;
  const bScore = b.score ?? -1;
  return bScore - aScore || a.name.localeCompare(b.name);
}
