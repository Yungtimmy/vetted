import { ERA_POINTS_WINDOW, LIVE_PROOF_PUBLISHES } from "@/lib/config";
import { publishCalldata } from "@/lib/publish-call";
import { scoreValidator, type ScorerInput } from "@/lib/scorer";
import { FORMULA_STATUS, SCORING_CONFIG_JSON } from "@/lib/scoring-config";
import { SCORING_CONFIG_SHA256 } from "@/lib/scoring-hash";
import {
  buildStakingView,
  loadLiveStaking,
  scoreIdToAccount,
} from "@/lib/staking-inputs";
import { readActiveValidators } from "@/lib/session-validators";

/**
 * Print a v1 score for one validator.
 * v1 proposed, pending founder approval. This does not publish on-chain.
 *
 *   npm run score -- --hash
 *   npm run score -- --active-eras 190 --commission 7 --chills 2 --slashes 1 --self-stake 18000 --era-points 1,1,1
 */

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (value == null || value.startsWith("--")) return undefined;
  return value;
}

function requireArg(name: string): string {
  const value = arg(name);
  if (value == null) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function numberArg(name: string): number {
  const parsed = Number(requireArg(name));
  if (!Number.isFinite(parsed)) throw new Error(`${name} is not a number`);
  return parsed;
}

function eraPoints(): number[] {
  const raw = arg("--era-points");
  const up = arg("--up-eras");
  if (raw != null && up != null) {
    throw new Error("Pass --era-points or --up-eras, not both");
  }
  if (up != null) {
    const count = Number(up);
    if (!Number.isInteger(count) || count < 0) {
      throw new Error("--up-eras must be a whole number of 0 or more");
    }
    return Array.from({ length: ERA_POINTS_WINDOW }, (_, index) =>
      index < count ? 1 : 0,
    );
  }
  if (raw == null || raw.trim() === "") return [];
  return raw.split(",").map((part) => {
    const parsed = Number(part.trim());
    if (!Number.isFinite(parsed)) throw new Error(`Bad era point "${part}"`);
    return parsed;
  });
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function printHeader(): void {
  process.stdout.write(`${FORMULA_STATUS}\n`);
  process.stdout.write(`sha256 ${SCORING_CONFIG_SHA256}\n`);
}

function printResult(result: ReturnType<typeof scoreValidator>): void {
  if (result.status === "new") {
    process.stdout.write("Grade NEW\n");
    process.stdout.write("No score. Fewer than the minimum eras are on record.\n");
    return;
  }
  for (const factor of result.factors) {
    const points = factor.points ?? 0;
    const rendered = points > 0 ? `+${points}` : String(points);
    process.stdout.write(
      `${pad(factor.label, 16)}${pad(`weight ${factor.weight}`, 14)}${pad(`raw ${factor.rawLabel}`, 18)}${rendered}\n`,
    );
  }
  process.stdout.write(`${pad("Total", 16)}${pad("", 14)}${pad("", 18)}${result.score}\n`);
  process.stdout.write(`Grade ${result.grade}\n`);
}

async function runLive(): Promise<void> {
  const eraArg = arg("--era");
  const active = await readActiveValidators();
  if (!active || active.length === 0) throw new Error("Active set could not be read");
  const chain = await loadLiveStaking(active);
  const era = eraArg == null || eraArg === "current" ? chain.currentEra : Number(eraArg);
  if (!Number.isInteger(era) || era <= 0) throw new Error("--era must be a positive integer or current");
  printHeader();
  process.stdout.write(`era ${era} · current era ${chain.currentEra}\n`);
  process.stdout.write(
    `retained ErasRewardPoints ${chain.retainedEras[0]}–${chain.retainedEras[chain.retainedEras.length - 1]} (${chain.retainedEras.length} eras)\n`,
  );
  process.stdout.write("No transaction is sent.\n\n");
  for (const account of active.map(scoreIdToAccount)) {
    const view = buildStakingView(chain, account, era);
    const scored = scoreValidator(view.input);
    const result =
      scored.status === "scored"
        ? {
            ...scored,
            factors: scored.factors.map((factor) =>
              factor.id === "chills"
                ? { ...factor, rawLabel: "not available on this chain" }
                : factor,
            ),
          }
        : scored;
    const published = LIVE_PROOF_PUBLISHES.find(
      (proof) => proof.era === era && proof.validator === account,
    );
    process.stdout.write(`${account}\n`);
    printResult(result);
    if (published) {
      process.stdout.write(
        `ScorePublished era ${published.era}: ${published.score}/${published.grade}\n`,
      );
    }
    if (result.status === "scored") {
      const calldata = publishCalldata(account, era, result.score, result.grade);
      process.stdout.write(
        `would call publish(${account}, ${era}, ${result.score}, ${result.grade})\n`,
      );
      process.stdout.write(`${calldata}\n`);
    }
    for (const note of view.notes) process.stdout.write(`note: ${note}\n`);
    process.stdout.write("\n");
  }
}

if (process.argv.includes("--hash")) {
  printHeader();
  process.stdout.write(`${SCORING_CONFIG_JSON}\n`);
  process.exit(0);
}

if (process.argv.includes("--live")) {
  runLive().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
} else {
const input: ScorerInput = {
  activeEras: numberArg("--active-eras"),
  commissionPercent: numberArg("--commission"),
  chills: numberArg("--chills"),
  slashes: numberArg("--slashes"),
  selfStake: numberArg("--self-stake"),
  eraPoints: eraPoints(),
};

const result = scoreValidator(input);
process.stdout.write(`${FORMULA_STATUS}\n`);
process.stdout.write(`sha256 ${SCORING_CONFIG_SHA256}\n`);
process.stdout.write(`era-point window ${ERA_POINTS_WINDOW}\n\n`);

if (result.status === "new") {
  process.stdout.write("Grade NEW\n");
  process.stdout.write("No score. Fewer than the minimum eras are on record.\n");
  process.exit(0);
}

for (const factor of result.factors) {
  const points = factor.points ?? 0;
  const rendered = points > 0 ? `+${points}` : String(points);
  process.stdout.write(
    `${pad(factor.label, 16)}${pad(`weight ${factor.weight}`, 14)}${pad(`raw ${factor.rawLabel}`, 16)}${rendered}\n`,
  );
}
process.stdout.write(`${pad("Total", 16)}${pad("", 14)}${pad("", 16)}${result.score}\n`);
process.stdout.write(`Grade ${result.grade}\n`);
}
