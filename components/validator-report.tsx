import Link from "next/link";
import { GradeSeal, gradeColor } from "@/components/grade-badge";
import { RewardsChart } from "@/components/rewards-chart";
import { SourceBadge } from "@/components/source-badge";
import { Sparkline } from "@/components/sparkline";
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

const TAG: Record<HistoryKind, { background: string; color: string }> = {
  COMMISSION: { background: "#3a2a10", color: "var(--grade-d)" },
  CHILL: { background: "#2a2f3d", color: "var(--grade-c)" },
  SLASH: { background: "#3b1416", color: "var(--grade-f)" },
};

export function ValidatorReport({
  validator,
  era,
}: {
  validator: Validator;
  era: number;
}) {
  const scored = validator.score != null;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-fg">
            ← Leaderboard
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1>{validator.name}</h1>
            <SourceBadge source={validator.source} />
          </div>
          <p className="font-mono text-xs text-muted">
            {shortSs58(validator.ss58)}
            {scored ? ` · H160 ${shortHex(validator.h160)}` : ""}
          </p>
        </div>
        {scored ? (
          <div className="flex flex-wrap gap-2">
            <TextLink
              href={explorerTxHref(validator.scoreTx)}
              className="btn btn-ghost"
            >
              View score on-chain ↗
            </TextLink>
            <Link href={`/nominate?add=${validator.id}`} className="btn">
              Nominate
            </Link>
          </div>
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
    <>
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <section className="card text-center">
          <GradeSeal grade={validator.grade} />
          <div className="mt-3 font-mono text-xl font-semibold">
            {total}
            <span className="text-xs font-normal text-muted">/100</span>
          </div>
          <p className="text-xs text-muted">
            Era {formatEra(era)}
            {validator.scoreTx ? ` · tx ${shortHex(validator.scoreTx)}` : ""}
          </p>
          <div className="mt-3 flex justify-center">
            <Sparkline
              values={validator.eraPoints}
              color={gradeColor(validator.grade)}
              label={`${validator.name} era points`}
            />
          </div>
        </section>

        <section className="card">
          <h3 className="mb-2">Why this score</h3>
          {validator.factors.map((factor) => (
            <div className="fx" key={factor.label}>
              <span>{factor.label}</span>
              <span
                className={`font-mono ${
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
            <span className="font-mono">{total}</span>
          </div>
        </section>

        <section className="card">
          <h3 className="mb-1.5">History</h3>
          {validator.history.length === 0 ? (
            <p className="py-3 text-sm text-muted">
              No slashes, chills, or commission changes in this window.
            </p>
          ) : (
            validator.history.map((event) => (
              <div className="flex items-center gap-3 border-b border-line py-2 last:border-b-0" key={event.id}>
                <span
                  className="tag"
                  style={{
                    background: TAG[event.kind].background,
                    color: TAG[event.kind].color,
                  }}
                >
                  {event.kind}
                </span>
                <span className="flex-1">{event.summary}</span>
                <span className="font-mono text-xs text-muted">
                  era {formatEra(event.era)}
                </span>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="card mt-4">
        <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3>Rewards per era</h3>
          <span className="text-xs text-muted">
            last {SLASH_WINDOW_ERAS} eras
            {marked ? " · red marks the slash" : ""}
          </span>
        </div>
        <RewardsChart rewards={validator.rewards} />
      </section>
    </>
  );
}

function NewReport({ validator }: { validator: Validator }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <section className="card text-center">
        <GradeSeal grade="NEW" />
        <p className="mt-3">Not enough history</p>
        <p className="text-sm text-fg">
          {erasRecorded(validator.activeEras, MIN_ERAS_TO_SCORE)}
        </p>
        <p className="text-xs text-muted">
          No grade until {MIN_ERAS_TO_SCORE} eras are on record. Left out of
          the set score.
        </p>
      </section>
      <section className="card">
        <h3 className="mb-2">What we know so far</h3>
        <div className="fx">
          <span>Slashes</span>
          <span className="font-mono">{validator.slashes}</span>
        </div>
        <div className="fx">
          <span>Chills</span>
          <span className="font-mono">{validator.chills}</span>
        </div>
        <div className="fx">
          <span>Commission</span>
          <span className="font-mono">
            {validator.commissionPercent}%, unchanged
          </span>
        </div>
        <div className="fx">
          <span>Self-stake</span>
          <span className="font-mono">
            {formatToken(validator.selfStake)} {TOKEN_DISPLAY_SYMBOL}
          </span>
        </div>
        <p className="mt-2.5 text-xs text-muted">
          No grade yet. New validators are never marked F just for being new.
        </p>
      </section>
    </div>
  );
}
