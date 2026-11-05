import Link from "next/link";
import { NotTracked } from "@/components/data-states";
import { GradeSeal } from "@/components/grade-badge";
import { RewardsChart } from "@/components/rewards-chart";
import { SourceBadge } from "@/components/source-badge";
import { TextLink } from "@/components/text-link";
import {
  MIN_ERAS_TO_SCORE,
  SLASH_WINDOW_ERAS,
  TOKEN_DISPLAY_SYMBOL,
} from "@/lib/config";
import {
  erasRecorded,
  explorerTxHref,
  formatDelta,
  formatEra,
  formatToken,
  shortHex,
  shortSs58,
} from "@/lib/format";
import type { HistoryKind, Validator } from "@/lib/types";

const TAG: Record<HistoryKind, string> = {
  COMMISSION: "var(--grade-d)",
  CHILL: "var(--grade-c)",
  SLASH: "var(--grade-f)",
};

export function ValidatorReport({
  validator,
  era,
}: {
  validator: Validator;
  era: number;
}) {
  const scored = validator.score != null;
  const named = validator.hasIdentity !== false;
  const title = named ? validator.name : validator.ss58;
  const meta = reportMeta(validator, named);
  const canVerify = validator.scoreBlock != null || validator.scoreTx != null;

  return (
    <div>
      <nav className="mb-4 flex items-center gap-2 text-[13px] text-dim" aria-label="Breadcrumb">
        <Link href="/" className="text-muted transition-colors duration-150 hover:text-teal">
          Leaderboard
        </Link>
        <span aria-hidden>/</span>
        <span>Validator</span>
      </nav>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-[22px] leading-snug font-medium tracking-[-0.02em] break-all">
              {title}
            </h1>
            <SourceBadge source={validator.source} />
          </div>
          {meta ? <p className="mt-2.5 font-mono text-xs text-dim">{meta}</p> : null}
        </div>
        {canVerify ? (
          <TextLink
            href={explorerTxHref(validator.scoreTx, validator.scoreBlock)}
            className="btn btn-ghost shrink-0"
          >
            Verify on-chain
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </TextLink>
        ) : null}
      </div>

      {scored ? (
        <ScoredReport validator={validator} era={era} />
      ) : (
        <NewReport validator={validator} />
      )}
    </div>
  );
}

function reportMeta(validator: Validator, named: boolean): string {
  const parts: string[] = [];
  if (named) parts.push(shortSs58(validator.ss58));
  if (validator.scoreTx) parts.push(`tx ${shortHex(validator.scoreTx)}`);
  if (validator.scoreBlock != null) parts.push(`block ${formatEra(validator.scoreBlock)}`);
  return parts.join(" · ");
}

function ScoredReport({
  validator,
  era,
}: {
  validator: Validator;
  era: number;
}) {
  const total = validator.score ?? 0;
  const marked = validator.rewards.some((bar) => bar.slashed);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)]">
      <section className="card flex flex-col items-start gap-4">
        <h2 className="text-[13px] font-medium tracking-normal text-muted">Grade</h2>
        <GradeSeal grade={validator.grade} />
        <div>
          <div className="font-mono text-xl font-medium tabular-nums">
            {total}
            <span className="text-sm font-normal text-dim">/100</span>
          </div>
          <p className="mt-2 font-mono text-[11px] leading-4 text-dim">
            Era {formatEra(era)} · published on-chain
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-[13px] font-medium tracking-normal text-muted">
          Why this score
        </h2>
        <div>
          {validator.factors.map((factor) => (
            <div className="fx" key={factor.label}>
              <span className="text-muted">{factor.label}</span>
              <span
                className={`font-mono tabular-nums ${
                  factor.delta != null && factor.delta < 0
                    ? "neg"
                    : factor.delta != null && factor.delta > 0
                      ? "pos"
                      : ""
                }`}
              >
                {factor.delta == null ? factor.points : formatDelta(factor.delta)}
              </span>
            </div>
          ))}
          <div className="fx fx-total">
            <span>Total</span>
            <span className="font-mono tabular-nums">{total}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-[13px] font-medium tracking-normal text-muted">History</h2>
        {validator.stakingTracked === false ? (
          <p className="text-[13px] text-dim">No era history yet</p>
        ) : validator.history.length === 0 ? (
          <p className="text-[13px] text-dim">
            No slashes, chills, or commission changes in this window.
          </p>
        ) : (
          validator.history.map((event) => (
            <div
              className="flex min-h-10 items-center gap-3 border-b border-line py-2 last:border-b-0"
              key={event.id}
            >
              <span
                className="tag"
                style={{
                  color: TAG[event.kind],
                  borderColor: `color-mix(in srgb, ${TAG[event.kind]} 32%, transparent)`,
                  background: `color-mix(in srgb, ${TAG[event.kind]} 12%, transparent)`,
                }}
              >
                {event.kind}
              </span>
              <span className="flex-1 text-[13px]">{event.summary}</span>
              <span className="font-mono text-xs text-dim tabular-nums">
                era {formatEra(event.era)}
              </span>
            </div>
          ))
        )}
      </section>

      <section className="card lg:col-span-3">
        <h2 className="mb-4 text-[13px] font-medium tracking-normal text-muted">
          Rewards per era · last {SLASH_WINDOW_ERAS} eras
          {validator.stakingTracked !== false && marked ? (
            <span className="font-normal text-dim"> · red marks a slash</span>
          ) : null}
        </h2>
        {validator.stakingTracked === false ? (
          <p className="py-6 text-[13px] text-dim">
            No reward series yet — Substrate staking fields are not wired
          </p>
        ) : (
          <RewardsChart rewards={validator.rewards} />
        )}
      </section>
    </div>
  );
}

function NewReport({ validator }: { validator: Validator }) {
  return (
    <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
      <section className="card flex flex-col items-start gap-4">
        <h2 className="text-[13px] font-medium tracking-normal text-muted">Grade</h2>
        <GradeSeal grade="NEW" />
        <div>
          <p className="text-sm">Not enough history</p>
          <p className="mt-2 font-mono text-[11px] leading-4 text-dim">
            {erasRecorded(validator.activeEras, MIN_ERAS_TO_SCORE)}
          </p>
          <p className="mt-2 text-xs text-dim">
            No grade until {MIN_ERAS_TO_SCORE} eras are on record. Left out of the set
            score.
          </p>
        </div>
      </section>
      <section className="card">
        <h2 className="mb-4 text-[13px] font-medium tracking-normal text-muted">
          What we know so far
        </h2>
        <div className="fx">
          <span className="text-muted">Slashes</span>
          <span className="font-mono">
            {validator.stakingTracked === false ? <NotTracked /> : validator.slashes}
          </span>
        </div>
        <div className="fx">
          <span className="text-muted">Chills</span>
          <span className="font-mono">
            {validator.stakingTracked === false ? <NotTracked /> : validator.chills}
          </span>
        </div>
        <div className="fx">
          <span className="text-muted">Commission</span>
          <span className="font-mono">
            {validator.stakingTracked === false ? (
              <NotTracked />
            ) : (
              `${validator.commissionPercent}%, unchanged`
            )}
          </span>
        </div>
        <div className="fx">
          <span className="text-muted">Self-stake</span>
          <span className="font-mono">
            {formatToken(validator.selfStake)} {TOKEN_DISPLAY_SYMBOL}
          </span>
        </div>
        <p className="mt-2.5 text-xs text-dim">
          No grade yet. New validators are never marked F just for being new.
        </p>
      </section>
    </div>
  );
}
