"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GradeBadge, gradeColor } from "@/components/grade-badge";
import { Sparkline } from "@/components/sparkline";
import { ERA_POINTS_WINDOW, SLASH_WINDOW_ERAS } from "@/lib/config";
import { formatPercent, shortSs58 } from "@/lib/format";
import type { Grade, NetworkOverview, Validator } from "@/lib/types";

type GradeFilter = "all" | Grade;
type SortKey = "score" | "commission" | "slashes" | "name";

const GRADES: Grade[] = ["A", "B", "C", "D", "F", "NEW"];

export function Leaderboard({
  overview,
  validators,
}: {
  overview: NetworkOverview;
  validators: Validator[];
}) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<GradeFilter>("all");
  const [lowCommission, setLowCommission] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [showNew, setShowNew] = useState(true);
  const [sort, setSort] = useState<SortKey>("score");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return validators
      .filter((validator) => {
        if (grade !== "all" && validator.grade !== grade) return false;
        if (lowCommission && validator.commissionPercent > 10) return false;
        if (activeOnly && !validator.active) return false;
        if (!showNew && validator.grade === "NEW") return false;
        if (!needle) return true;
        const haystack = `${validator.name} ${validator.ss58} ${validator.h160}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => compareValidators(a, b, sort));
  }, [validators, query, grade, lowCommission, activeOnly, showNew, sort]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>Validator report cards</h1>
          <p className="text-sm text-muted">
            Know who you&apos;re staking with. Scores published on-chain every
            era.
          </p>
        </div>
        <Link href="/nominate" className="btn self-start">
          Nominate safely
        </Link>
      </div>

      <div className="mb-[18px] grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="Validators scored" value={String(overview.validatorsScored)} />
        <Stat
          label="Graded A"
          value={String(overview.gradedA)}
          valueClass="text-grade-a"
        />
        <Stat
          label={`Slashed, last ${SLASH_WINDOW_ERAS} eras`}
          value={String(overview.slashedLastWindow)}
          valueClass="text-grade-f"
        />
        <Stat
          label="Median commission"
          value={formatPercent(overview.medianCommissionPercent, 1)}
        />
      </div>

      <div className="card" id="board">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            className="search sm:w-64"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or address"
            aria-label="Search validators"
          />
          <label
            className="chip"
            data-active={grade !== "all" ? "true" : "false"}
          >
            <span className="sr-only">Filter by grade</span>
            <select
              value={grade}
              onChange={(event) => setGrade(event.target.value as GradeFilter)}
            >
              <option value="all">All grades</option>
              {GRADES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <FilterButton
            pressed={lowCommission}
            onClick={() => setLowCommission((value) => !value)}
          >
            Commission ≤ 10%
          </FilterButton>
          <FilterButton
            pressed={activeOnly}
            onClick={() => setActiveOnly((value) => !value)}
          >
            Active only
          </FilterButton>
          <FilterButton pressed={showNew} onClick={() => setShowNew((value) => !value)}>
            Show new
          </FilterButton>
          <label
            className="chip"
            data-active={sort !== "score" ? "true" : "false"}
          >
            <span className="sr-only">Sort validators</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            >
              <option value="score">Sort: score</option>
              <option value="commission">Sort: commission</option>
              <option value="slashes">Sort: slashes</option>
              <option value="name">Sort: name</option>
            </select>
          </label>
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
            <ul className="space-y-3 xl:hidden">
              {rows.map((validator, index) => (
                <li key={validator.id} className="rounded-lg border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 text-xs text-muted">#{index + 1}</div>
                      <GradeBadge grade={validator.grade} score={validator.score} />
                      <Link
                        href={`/validator/${validator.id}`}
                        className="mt-2 block font-medium text-fg hover:underline"
                      >
                        {validator.name}
                      </Link>
                      <div className="truncate font-mono text-xs text-muted">
                        {shortSs58(validator.ss58)}
                      </div>
                    </div>
                    <Sparkline
                      values={validator.eraPoints}
                      color={gradeColor(validator.grade)}
                      label={`${validator.name} era points, last ${ERA_POINTS_WINDOW} eras`}
                    />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted">Commission</dt>
                      <dd
                        className={`font-mono ${validator.commissionPercent > 10 ? "neg" : ""}`}
                      >
                        {formatPercent(validator.commissionPercent)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Slashes</dt>
                      <dd className={`font-mono ${validator.slashes > 0 ? "neg" : ""}`}>
                        {validator.slashes}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Chills</dt>
                      <dd className="font-mono">{validator.chills}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/nominate?add=${validator.id}`}
                    className="btn btn-ghost mt-3 w-full"
                  >
                    Nominate
                  </Link>
                </li>
              ))}
            </ul>
            <div className="table-wrap hidden xl:block">
            <table className="data">
              <caption className="sr-only">Validator leaderboard</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Grade</th>
                  <th scope="col">Validator</th>
                  <th scope="col">Commission</th>
                  <th scope="col">Slashes</th>
                  <th scope="col">Chills</th>
                  <th scope="col">Era points, last {ERA_POINTS_WINDOW}</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows.map((validator, index) => (
                  <tr key={validator.id}>
                    <td className="text-xs text-muted">{index + 1}</td>
                    <td>
                      <GradeBadge grade={validator.grade} score={validator.score} />
                    </td>
                    <td>
                      <Link
                        href={`/validator/${validator.id}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {validator.name}
                      </Link>
                      <div className="font-mono text-xs text-muted">
                        {shortSs58(validator.ss58)}
                      </div>
                    </td>
                    <td
                      className={`font-mono ${validator.commissionPercent > 10 ? "neg" : ""}`}
                    >
                      {formatPercent(validator.commissionPercent)}
                    </td>
                    <td className={`font-mono ${validator.slashes > 0 ? "neg" : ""}`}>
                      {validator.slashes}
                    </td>
                    <td className="font-mono">{validator.chills}</td>
                    <td>
                      <Sparkline
                        values={validator.eraPoints}
                        color={gradeColor(validator.grade)}
                        label={`${validator.name} era points, last ${ERA_POINTS_WINDOW} eras`}
                      />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/nominate?add=${validator.id}`}
                        className="btn btn-ghost whitespace-nowrap"
                      >
                        Nominate
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
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="card">
      <div className="k">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

function FilterButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
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
