import type { Metadata } from "next";
import Link from "next/link";
import {
  ERA_POINTS_WINDOW,
  MIN_ERAS_TO_SCORE,
  SLASH_WINDOW_ERAS,
} from "@/lib/config";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How Vetted scores Portaldot validators each era.",
};

export default function MethodologyPage() {
  return (
    <article className="max-w-3xl">
      <h1>Methodology</h1>
      <p className="mt-2 text-sm text-muted">
        A score is a report card, not a promise of future rewards. Vetted
        publishes one number per validator, every era, so a nominator can see
        the risk before they bond. On this testnet those scores are built from
        mainnet history and published on the contract. The two validators
        actually running here are tagged Testnet live and shown beside that
        history.
      </p>

      <h2 className="mt-8 text-lg">What goes into the score</h2>
      <p className="mt-2 text-sm text-muted">
        Every scored validator starts at 100. The breakdown on the report card
        is the list of adjustments that landed on the published total.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        <li className="card">
          <span className="font-semibold">Slashes.</span>{" "}
          <span className="text-muted">
            A slash in the record is the heaviest mark. The leaderboard counts
            slashes over the last {SLASH_WINDOW_ERAS} eras, and the rewards
            chart paints that era red.
          </span>
        </li>
        <li className="card">
          <span className="font-semibold">Chills.</span>{" "}
          <span className="text-muted">
            Dropping out of the active set shows up as chills in the last{" "}
            {ERA_POINTS_WINDOW} eras. Repeated chills cost more than a single one.
          </span>
        </li>
        <li className="card">
          <span className="font-semibold">Commission changes.</span>{" "}
          <span className="text-muted">
            A raise after nominators have bonded is a point deduction. A high
            but stable commission is visible on the card either way.
          </span>
        </li>
        <li className="card">
          <span className="font-semibold">Steady rewards.</span>{" "}
          <span className="text-muted">
            A validator that keeps producing across {SLASH_WINDOW_ERAS} eras can
            earn a small bonus. The era-point sparkline is the last{" "}
            {ERA_POINTS_WINDOW} eras of that story.
          </span>
        </li>
      </ul>

      <h2 className="mt-8 text-lg">Grades</h2>
      <p className="mt-2 text-sm text-muted">
        The letter is a band on the 0–100 score. A is the top of the set, F is
        a validator with a serious slash or chill history. The bands in this
        preview are A from 85, B from 65, C from 50, D from 30, and F below that.
      </p>

      <h2 className="mt-8 text-lg">New validators</h2>
      <p className="mt-2 text-sm text-muted">
        A validator with fewer than {MIN_ERAS_TO_SCORE} eras of history stays{" "}
        <span className="font-semibold text-fg">NEW</span>. They are never
        marked F just for being new. The card shows the slashes, chills,
        commission, and self-stake we already have, and it says how many eras
        are left before a fair score.
      </p>

      <p className="mt-8 text-sm text-muted">
        Scores on these pages are read live from the ScoreRegistry contract on
        Portaldot testnet. The number on each card is the number stored
        on-chain for that era. See{" "}
        <Link href="/contract" className="link">
          API & contract
        </Link>{" "}
        for the contract address.
      </p>
    </article>
  );
}
