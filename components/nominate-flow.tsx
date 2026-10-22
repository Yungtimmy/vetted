"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadNote } from "@/components/data-states";
import { GradeBadge, GradeSeal, gradeColor } from "@/components/grade-badge";
import { NominateSkeleton } from "@/components/skeletons";
import { TextLink } from "@/components/text-link";
import {
  DEFAULT_BOND_TOKENS,
  DEFAULT_NOMINATION_IDS,
  MIN_ERAS_TO_SCORE,
  MOCK_NOMINATION_TX,
  MOCK_SPENDABLE_TOKENS,
  NOMINATION_CAP,
  TOKEN_DISPLAY_SYMBOL,
} from "@/lib/config";
import {
  erasRecorded,
  explorerTxHref,
  formatEra,
  formatReward,
  formatToken,
  parseBond,
  shortHex,
  shortSs58,
} from "@/lib/format";
import {
  estimateRewardPerEra,
  gradeForScore,
  headsUpMessage,
  isRiskyGrade,
  setFindings,
  weightedSetScore,
} from "@/lib/scoring";
import type { Validator } from "@/lib/types";

type Phase = "choose" | "review" | "signing" | "sent";
type SortKey = "score" | "commission" | "name";

function includeId(current: string[], id: string, known: Set<string>): string[] {
  if (!known.has(id) || current.includes(id) || current.length >= NOMINATION_CAP) {
    return current;
  }
  return [...current, id];
}

function initialSelection(addId: string | null, known: Set<string>): string[] {
  const defaults = DEFAULT_NOMINATION_IDS.filter((id) => known.has(id));
  return addId ? includeId([...defaults], addId, known) : [...defaults];
}

export function NominateFlow({
  validators,
  era,
  addId,
  status,
}: {
  validators: Validator[];
  era: number;
  addId: string | null;
  status: "ready" | "loading" | "empty" | "error";
}) {
  const known = new Set(validators.map((validator) => validator.id));
  const [selectedIds, setSelectedIds] = useState(() =>
    initialSelection(addId, known),
  );
  const [phase, setPhase] = useState<Phase>("choose");
  const [bond, setBond] = useState(DEFAULT_BOND_TOKENS.toFixed(2));
  const [sort, setSort] = useState<SortKey>("score");
  const [hideRisky, setHideRisky] = useState(false);
  const [lowCommission, setLowCommission] = useState(false);
  const [capNotice, setCapNotice] = useState(false);

  const byId = new Map(validators.map((validator) => [validator.id, validator]));
  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((validator): validator is Validator => validator != null);
  const score = weightedSetScore(selected);
  const grade = score == null ? null : gradeForScore(score);
  const findings = setFindings(selected);
  const warning = headsUpMessage(selected);
  const amount = parseBond(bond);
  const reward = estimateRewardPerEra(amount, score);
  const canContinue = selected.length > 0 && amount > 0;
  const unscored = selected.filter(
    (validator) => validator.grade === "NEW" || validator.score == null,
  );

  const visible = validators
    .filter((validator) => (hideRisky ? !isRiskyGrade(validator.grade) : true))
    .filter((validator) =>
      lowCommission ? validator.commissionPercent <= 10 : true,
    )
    .sort((a, b) => compare(a, b, sort));

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      setCapNotice(false);
      setSelectedIds(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= NOMINATION_CAP) {
      setCapNotice(true);
      return;
    }
    setCapNotice(false);
    setSelectedIds([...selectedIds, id]);
  }

  function sign() {
    setPhase("signing");
    window.setTimeout(() => setPhase("sent"), 700);
  }

  if (status === "loading") return <NominateSkeleton />;

  if (status === "error" || status === "empty") {
    return (
      <div>
        <h1>Build your nomination set</h1>
        <div className="mt-3">
          <LoadNote
            message={
              status === "error"
                ? "The nomination list could not be loaded."
                : "No validators returned."
            }
            action="Retry"
            actionHref="/nominate"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <StepButton
          label="1 · Choose"
          on={phase === "choose" || phase === "review" || phase === "signing" || phase === "sent"}
          onClick={() => setPhase("choose")}
        />
        <StepButton
          label="2 · Review"
          on={phase === "review" || phase === "signing" || phase === "sent"}
          onClick={() => {
            if (canContinue) setPhase("review");
          }}
          disabled={!canContinue && phase === "choose"}
        />
        <span className="step" data-on={phase === "sent" ? "true" : "false"}>
          3 · Sign
        </span>
      </div>

      {phase === "choose" ? (
        <ChooseStep
          visible={visible}
          selectedIds={selectedIds}
          selected={selected}
          score={score}
          grade={grade}
          findings={findings}
          unscored={unscored}
          bond={bond}
          reward={reward}
          canContinue={canContinue}
          capNotice={capNotice}
          sort={sort}
          hideRisky={hideRisky}
          lowCommission={lowCommission}
          onSort={setSort}
          onHideRisky={() => setHideRisky((value) => !value)}
          onLowCommission={() => setLowCommission((value) => !value)}
          onBond={setBond}
          onToggle={toggle}
          onReview={() => setPhase("review")}
        />
      ) : null}

      {phase === "review" || phase === "signing" ? (
        <ReviewStep
          selected={selected}
          amount={amount}
          score={score}
          unscored={unscored}
          warning={warning}
          signing={phase === "signing"}
          onSign={sign}
        />
      ) : null}

      {phase === "sent" ? <SentStep era={era} /> : null}
    </div>
  );
}

function ChooseStep({
  visible,
  selectedIds,
  selected,
  score,
  grade,
  findings,
  unscored,
  bond,
  reward,
  canContinue,
  capNotice,
  sort,
  hideRisky,
  lowCommission,
  onSort,
  onHideRisky,
  onLowCommission,
  onBond,
  onToggle,
  onReview,
}: {
  visible: Validator[];
  selectedIds: string[];
  selected: Validator[];
  score: number | null;
  grade: ReturnType<typeof gradeForScore> | null;
  findings: ReturnType<typeof setFindings>;
  unscored: Validator[];
  bond: string;
  reward: number | null;
  canContinue: boolean;
  capNotice: boolean;
  sort: SortKey;
  hideRisky: boolean;
  lowCommission: boolean;
  onSort: (sort: SortKey) => void;
  onHideRisky: () => void;
  onLowCommission: () => void;
  onBond: (value: string) => void;
  onToggle: (id: string) => void;
  onReview: () => void;
}) {
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1>Build your nomination set</h1>
          <p className="text-sm text-muted">
            We pre-picked the safest validators. Swap any of them before you
            sign.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="chip" data-active={sort !== "score" ? "true" : "false"}>
            <span className="sr-only">Sort validators</span>
            <select
              value={sort}
              onChange={(event) => onSort(event.target.value as SortKey)}
            >
              <option value="score">Sort: score</option>
              <option value="commission">Sort: commission</option>
              <option value="name">Sort: name</option>
            </select>
          </label>
          <button type="button" className="chip" aria-pressed={hideRisky} onClick={onHideRisky}>
            Hide risky
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={lowCommission}
            onClick={onLowCommission}
          >
            Commission ≤ 10%
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="order-2 grid gap-3 sm:grid-cols-2 xl:order-1">
          {visible.map((validator) => (
            <ValidatorCard
              key={validator.id}
              validator={validator}
              selected={selectedIds.includes(validator.id)}
              onToggle={() => onToggle(validator.id)}
            />
          ))}
        </div>
        <aside className="order-1 xl:sticky xl:top-6 xl:order-2">
          <SetPanel
            selected={selected}
            score={score}
            grade={grade}
            findings={findings}
            unscored={unscored}
            bond={bond}
            reward={reward}
            canContinue={canContinue}
            capNotice={capNotice}
            onBond={onBond}
            onReview={onReview}
          />
        </aside>
      </div>
    </div>
  );
}

function ValidatorCard({
  validator,
  selected,
  onToggle,
}: {
  validator: Validator;
  selected: boolean;
  onToggle: () => void;
}) {
  const risky = isRiskyGrade(validator.grade);
  const note = risky
    ? "Risky, not recommended"
    : validator.grade === "NEW"
      ? erasRecorded(validator.activeEras, MIN_ERAS_TO_SCORE)
      : null;

  return (
    <div
      className={`card cursor-pointer ${selected ? "border-teal" : ""} ${risky ? "opacity-60" : ""}`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <GradeBadge grade={validator.grade} score={validator.score} />
        <button
          type="button"
          aria-pressed={selected}
          aria-label={`${selected ? "Remove" : "Add"} ${validator.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          className="grid h-8 w-8 shrink-0 place-items-center"
        >
          <span
            className={`h-4 w-4 rounded-[4px] border-[1.5px] ${selected ? "border-teal bg-teal" : "border-muted bg-transparent"}`}
          />
        </button>
      </div>
      <Link
        href={`/validator/${validator.id}`}
        onClick={(event) => event.stopPropagation()}
        className="mt-2.5 block font-semibold text-fg hover:text-accent-soft"
      >
        {validator.name}
      </Link>
      <div className="font-mono text-xs text-muted">{shortSs58(validator.ss58)}</div>
      <div className="my-3 h-1 overflow-hidden rounded-sm bg-line">
        <div
          className="h-1 rounded-sm"
          style={{
            width: `${validator.score ?? 0}%`,
            background: gradeColor(validator.grade),
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{validator.commissionPercent}% fee</span>
        <span>
          {validator.slashes} slash · {validator.chills} chill
        </span>
      </div>
      {note ? (
        <p className={`mt-1.5 text-xs ${risky ? "neg" : "text-muted"}`}>{note}</p>
      ) : null}
    </div>
  );
}

function SetPanel({
  selected,
  score,
  grade,
  findings,
  unscored,
  bond,
  reward,
  canContinue,
  capNotice,
  onBond,
  onReview,
}: {
  selected: Validator[];
  score: number | null;
  grade: ReturnType<typeof gradeForScore> | null;
  findings: ReturnType<typeof setFindings>;
  unscored: Validator[];
  bond: string;
  reward: number | null;
  canContinue: boolean;
  capNotice: boolean;
  onBond: (value: string) => void;
  onReview: () => void;
}) {
  return (
    <div className="card border-line-2 bg-panel-2">
      <p className="k">Your set</p>
      <div className="mt-1 mb-2.5 flex items-baseline gap-2">
        <span className="font-mono text-[34px] leading-none font-semibold">
          {selected.length}
        </span>
        <span className="font-mono text-xs text-muted">
          / {NOMINATION_CAP} slots
        </span>
      </div>
      <div
        className="mb-4 grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${NOMINATION_CAP}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {Array.from({ length: NOMINATION_CAP }, (_, index) => {
          const validator = selected[index];
          return (
            <div
              key={index}
              className="h-2 rounded-[2px]"
              style={{
                background: validator ? gradeColor(validator.grade) : "var(--line)",
              }}
            />
          );
        })}
      </div>
      <div className="mb-3.5 flex items-center gap-3">
        {grade ? <GradeSeal grade={grade} size="md" /> : null}
        <div>
          <div className="font-mono text-xl font-semibold">
            {score == null ? "n/a" : score}
            <span className="text-xs font-normal text-muted">/100</span>
          </div>
          <div className="text-xs text-muted">Set score, weighted by stake</div>
        </div>
      </div>
      {unscored.map((validator) => (
        <p className="mb-2 text-xs text-muted" key={validator.id}>
          {validator.name} is left out of the set score (
          {erasRecorded(validator.activeEras, MIN_ERAS_TO_SCORE)}).
        </p>
      ))}
      {findings.length === 0 ? (
        <p className="py-2 text-sm text-muted">Add a validator to score this set.</p>
      ) : (
        <div>
          {findings.map((finding) => (
            <div className="fx" key={finding.text}>
              <span className={finding.tone === "ok" ? "pos" : "warn"} aria-hidden>
                {finding.tone === "ok" ? "✓" : "·"}
              </span>
              <span className="ml-2 flex-1">{finding.text}</span>
            </div>
          ))}
        </div>
      )}
      <p className="k mt-4">Amount to bond</p>
      <div className="mt-1.5 flex items-center justify-between rounded-xl border border-line bg-bg px-3 py-2.5">
        <label className="sr-only" htmlFor="bond">
          Amount to bond
        </label>
        <input
          id="bond"
          inputMode="decimal"
          value={bond}
          onChange={(event) => onBond(event.target.value)}
          className="w-full bg-transparent font-mono text-lg text-fg outline-none"
        />
        <button
          type="button"
          className="shrink-0 text-xs text-muted hover:text-fg"
          onClick={() => onBond(MOCK_SPENDABLE_TOKENS.toFixed(2))}
        >
          {TOKEN_DISPLAY_SYMBOL} · Max
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        {reward == null
          ? "Est. reward unavailable until the set has a score."
          : `Est. reward ≈ ${formatReward(reward)} ${TOKEN_DISPLAY_SYMBOL} per era`}
      </p>
      {capNotice ? (
        <p className="mt-2 text-xs caution">
          This set is full ({NOMINATION_CAP} slots). Remove one to add another.
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn-block mt-4"
        disabled={!canContinue}
        onClick={onReview}
      >
        Review nomination →
      </button>
    </div>
  );
}

function ReviewStep({
  selected,
  amount,
  score,
  unscored,
  warning,
  signing,
  onSign,
}: {
  selected: Validator[];
  amount: number;
  score: number | null;
  unscored: Validator[];
  warning: string | null;
  signing: boolean;
  onSign: () => void;
}) {
  return (
    <div>
      <h1 className="mb-3">Review nomination</h1>
      <div className="card max-w-[640px]">
        {selected.map((validator) => (
          <div className="fx" key={validator.id}>
            <span>{validator.name}</span>
            <GradeBadge grade={validator.grade} score={validator.score} />
          </div>
        ))}
        <div className="fx">
          <span>Amount to bond</span>
          <span className="font-mono">
            {formatToken(amount, 2)} {TOKEN_DISPLAY_SYMBOL}
          </span>
        </div>
        <div className="fx">
          <span>Average score</span>
          <span className="font-mono">
            {score == null ? "n/a" : `${score}/100`}
          </span>
        </div>
        {unscored.map((validator) => (
          <p className="mt-2 text-xs text-muted" key={validator.id}>
            {validator.name} is left out of the set score (
            {erasRecorded(validator.activeEras, MIN_ERAS_TO_SCORE)}).
          </p>
        ))}
        {warning ? <p className="mt-2 text-sm caution">{warning}</p> : null}
        <button
          type="button"
          className="btn mt-3.5"
          onClick={onSign}
          disabled={signing}
        >
          {signing ? "Waiting for wallet…" : "Sign in your wallet"}
        </button>
      </div>
    </div>
  );
}

function SentStep({ era }: { era: number }) {
  return (
    <div className="card max-w-[640px] px-6 py-12 text-center">
      <div
        className="grade-letter mx-auto mb-3 grid h-[120px] w-[120px] place-items-center rounded-full bg-teal text-5xl text-bg"
        aria-hidden
      >
        ✓
      </div>
      <h2>Nomination sent</h2>
      <p className="mt-2 font-mono text-xs text-muted">
        tx {shortHex(MOCK_NOMINATION_TX)} · era {formatEra(era)}
      </p>
      <TextLink href={explorerTxHref(MOCK_NOMINATION_TX)} className="link mt-2 inline-block">
        View on Portaldot explorer ↗
      </TextLink>
    </div>
  );
}

function StepButton({
  label,
  on,
  onClick,
  disabled = false,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="step"
      data-on={on ? "true" : "false"}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function compare(a: Validator, b: Validator, sort: SortKey): number {
  if (sort === "name") return a.name.localeCompare(b.name);
  if (sort === "commission") {
    return a.commissionPercent - b.commissionPercent || a.name.localeCompare(b.name);
  }
  const aScore = a.score ?? -1;
  const bScore = b.score ?? -1;
  return bScore - aScore || a.name.localeCompare(b.name);
}
