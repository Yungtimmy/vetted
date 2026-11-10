import { ERA_POINTS_WINDOW } from "@/lib/config";
import { scoreValidator, type ScorerInput } from "@/lib/scorer";
import { FORMULA_STATUS, SCORING_CONFIG_JSON } from "@/lib/scoring-config";
import { SCORING_CONFIG_SHA256 } from "@/lib/scoring-hash";

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

if (process.argv.includes("--hash")) {
  process.stdout.write(`${FORMULA_STATUS}\n`);
  process.stdout.write(`sha256 ${SCORING_CONFIG_SHA256}\n`);
  process.stdout.write(`${SCORING_CONFIG_JSON}\n`);
  process.exit(0);
}

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
