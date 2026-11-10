import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { LIVE_PROOF_PUBLISHES } from "@/lib/config";
import { mockProvider } from "@/lib/mock-provider";
import {
  breakdownForValidator,
  largestRemainder,
  scoreValidator,
  type ScorerInput,
} from "@/lib/scorer";
import { gradeForScore, totalFromFactors, weightedSetScore } from "@/lib/scoring";
import {
  FORMULA_STATUS,
  SCORE_WEIGHTS,
  SCORING_CONFIG_JSON,
} from "@/lib/scoring-config";
import { SCORING_CONFIG_SHA256 } from "@/lib/scoring-hash";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function up(count: number): number[] {
  return Array.from({ length: 30 }, (_, index) => (index < count ? 1 : 0));
}

const clean: ScorerInput = {
  activeEras: 28,
  eraPoints: up(30),
  commissionPercent: 5,
  chills: 0,
  slashes: 0,
  selfStake: 50_000,
};

test("penalty weights sum to the base of 100", () => {
  const sum = Object.values(SCORE_WEIGHTS).reduce((total, weight) => total + weight, 0);
  assert.equal(sum, 100);
});

test("a clean validator scores 100 and the points sum to that", () => {
  const result = scoreValidator(clean);
  assert.equal(result.status, "scored");
  if (result.status !== "scored") return;
  assert.equal(result.score, 100);
  assert.equal(result.grade, "A");
  assert.equal(totalFromFactors(result.factors), 100);
  assert.equal(result.factors.find((factor) => factor.id === "uptime")?.points, 0);
});

test("fewer than 28 eras stays NEW", () => {
  const result = scoreValidator({ ...clean, activeEras: 27 });
  assert.deepEqual(result, { status: "new", grade: "NEW", score: null, factors: [] });
});

test("every penalty at its cap scores 0", () => {
  const result = scoreValidator({
    activeEras: 28,
    eraPoints: [],
    commissionPercent: 20,
    chills: 10,
    slashes: 3,
    selfStake: 0,
  });
  assert.equal(result.status, "scored");
  if (result.status !== "scored") return;
  assert.equal(result.score, 0);
  assert.equal(result.grade, "F");
  assert.equal(totalFromFactors(result.factors), 0);
});

test("six chills cost less than nine", () => {
  const at = (chills: number) => {
    const result = scoreValidator({ ...clean, chills });
    assert.equal(result.status, "scored");
    if (result.status !== "scored") return 0;
    return result.factors.find((factor) => factor.id === "chills")?.points ?? 0;
  };
  const six = at(6);
  const nine = at(9);
  assert.equal(six, -9);
  assert.equal(nine, -14);
  assert.ok(nine < six);
});

test("Kola Staking inputs score 78 with the documented breakdown", () => {
  const result = scoreValidator({
    activeEras: 190,
    eraPoints: up(30),
    commissionPercent: 7,
    chills: 2,
    slashes: 1,
    selfStake: 18_000,
  });
  assert.equal(result.status, "scored");
  if (result.status !== "scored") return;
  assert.equal(result.score, 78);
  assert.equal(result.grade, "B");
  assert.deepEqual(
    result.factors.map((factor) => [factor.id, factor.points]),
    [
      ["base", 100],
      ["uptime", 0],
      ["slashes", -14],
      ["chills", -3],
      ["commission", -2],
      ["selfStake", -3],
    ],
  );
  assert.equal(totalFromFactors(result.factors), result.score);
});

test("grade bands match the contract cuts", () => {
  assert.equal(gradeForScore(100), "A");
  assert.equal(gradeForScore(85), "A");
  assert.equal(gradeForScore(84), "B");
  assert.equal(gradeForScore(65), "B");
  assert.equal(gradeForScore(64), "C");
  assert.equal(gradeForScore(50), "C");
  assert.equal(gradeForScore(49), "D");
  assert.equal(gradeForScore(30), "D");
  assert.equal(gradeForScore(29), "F");
  assert.equal(gradeForScore(0), "F");
  const source = readFileSync(path.join(root, "contracts/ScoreRegistry.sol"), "utf8");
  for (const min of [85, 65, 50, 30]) {
    assert.match(source, new RegExp(`score >= ${min}`));
  }
});

test("largest remainder sends the leftover to the biggest fraction", () => {
  assert.deepEqual(largestRemainder([0, 13 + 1 / 3, 3, 2, 3.2]), [0, 14, 3, 2, 3]);
});

test("the same input scores the same result twice", () => {
  const input: ScorerInput = { ...clean, chills: 4, commissionPercent: 10, selfStake: 15_000 };
  assert.deepEqual(scoreValidator(input), scoreValidator(input));
});

test("a hand-published row is not scored with v1 weights", () => {
  const result = breakdownForValidator({
    ...clean,
    stakingTracked: false,
  });
  assert.deepEqual(result, { status: "manual" });
});

test("sample fixtures: breakdown sums to the displayed score", async () => {
  const validators = await mockProvider.listValidators();
  assert.ok(validators.length > 0);
  for (const validator of validators) {
    const again = scoreValidator({
      activeEras: validator.activeEras,
      eraPoints: validator.eraPoints,
      commissionPercent: validator.commissionPercent,
      chills: validator.chills,
      slashes: validator.slashes,
      selfStake: validator.selfStake,
    });
    assert.equal(again.grade, validator.grade, validator.id);
    assert.equal(again.score, validator.score, validator.id);
    assert.deepEqual(again.factors, validator.factors, validator.id);
    if (validator.score == null) {
      assert.equal(validator.grade, "NEW");
      assert.equal(totalFromFactors(validator.factors), 0);
      continue;
    }
    assert.equal(totalFromFactors(validator.factors), validator.score, validator.id);
    assert.equal(gradeForScore(validator.score), validator.grade, validator.id);
  }
  const defaults = ["lagos-validator", "ibadan-infra", "abuja-secure", "northstar-node"].map(
    (id) => {
      const validator = validators.find((item) => item.id === id);
      assert.ok(validator, id);
      return validator;
    },
  );
  assert.equal(weightedSetScore(defaults), 97);
});

test("config hash is the sha256 of the canonical JSON", () => {
  const hashed = createHash("sha256").update(SCORING_CONFIG_JSON, "utf8").digest("hex");
  assert.equal(SCORING_CONFIG_SHA256, hashed);
  assert.equal(
    SCORING_CONFIG_SHA256,
    "7c487240c4e4acda68c998c7379d6273b7ba5b3182d89dfc17d141e160cc5508",
  );
  const doc = readFileSync(path.join(root, "SCORING.md"), "utf8");
  assert.ok(doc.includes(SCORING_CONFIG_SHA256));
  assert.ok(doc.includes(SCORING_CONFIG_JSON));
  assert.ok(doc.includes(FORMULA_STATUS));
  assert.match(doc, /entered by hand/);
  assert.match(doc, /next publish will use the v1 scorer/);
  assert.equal(FORMULA_STATUS, "v1 proposed, pending founder approval");
});

test("published ScoreRegistry rows stay the hand-entered record", () => {
  const era64 = LIVE_PROOF_PUBLISHES.filter((proof) => proof.era === 64);
  assert.equal(era64.length, 2);
  for (const proof of era64) {
    assert.equal(proof.score, 100);
    assert.equal(proof.grade, "A");
  }
});

test("CLI prints the Kola score and does not publish", () => {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--import",
      "./scripts/register-ts.mjs",
      "scripts/score-validator.ts",
      "--active-eras",
      "190",
      "--commission",
      "7",
      "--chills",
      "2",
      "--slashes",
      "1",
      "--self-stake",
      "18000",
      "--up-eras",
      "30",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /v1 proposed, pending founder approval/);
  assert.match(result.stdout, /Total\s+78/);
  assert.match(result.stdout, /Grade B/);
  assert.doesNotMatch(result.stdout, /publish/i);
});
