import type { Metadata } from "next";
import Link from "next/link";
import {
  ERA_POINTS_WINDOW,
  MIN_ERAS_TO_SCORE,
  SLASH_WINDOW_ERAS,
} from "@/lib/config";
import { SCORING_DOC_URL } from "@/lib/scoring-config";
import { TextLink } from "@/components/text-link";

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
        the risk before they bond. The v1 formula reads on-chain history.
        Scores already on ScoreRegistry were entered by hand. The site reads
        those logs back from the contract.
      </p>

      <h2 className="mt-8 text-lg">What goes into the score</h2>
      <p className="mt-2 text-sm text-muted">
        The checked-in formula is v1 proposed, pending founder approval. It
        starts at 100 and subtracts five terms. Slashes carry the largest
        weight. The full table, the rounding rule, and the config hash are in{" "}
        <TextLink href={SCORING_DOC_URL} className="link">
          SCORING.md
        </TextLink>
        . Scores already published on ScoreRegistry were entered by hand. These
        weights did not produce them. The next publish will use the v1 scorer.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        <li className="card">
          <span className="font-semibold">Slashes.</span>{" "}
          <span className="text-muted">
            Count over the last {SLASH_WINDOW_ERAS} eras. Weight 40, full at 3
            slashes. The rewards chart paints a slashed era red.
          </span>
        </li>
        <li className="card">
          <span className="font-semibold">Uptime.</span>{" "}
          <span className="text-muted">
            Eras with points above zero in the last {ERA_POINTS_WINDOW}. Weight
            25. The sparkline is that window.
          </span>
        </li>
        <li className="card">
          <span className="font-semibold">Chills.</span>{" "}
          <span className="text-muted">
            Count over the last {ERA_POINTS_WINDOW} eras. Weight 15, full at 10
            chills, so six and nine are not the same deduction.
          </span>
        </li>
        <li className="card">
          <span className="font-semibold">Commission.</span>{" "}
          <span className="text-muted">
            The current percent. Weight 15. No deduction at 5% or below, full
            deduction at 20% and above.
          </span>
        </li>
        <li className="card">
          <span className="font-semibold">Self-stake.</span>{" "}
          <span className="text-muted">
            Whole tokens. Weight 5. No deduction at 50,000 tokens or above.
          </span>
        </li>
      </ul>

      <h2 className="mt-8 text-lg">Grades</h2>
      <p className="mt-2 text-sm text-muted">
        The letter is a band on the 0–100 score. A is from 85, B from 65, C
        from 50, D from 30, and F below that. ScoreRegistry enforces the same
        cuts when a score is published.
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
