import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { publishCalldata, publishSelectorHex } from "@/lib/publish-call";
import { scoreValidator } from "@/lib/scorer";
import { totalFromFactors } from "@/lib/scoring";
import {
  CHILL_LIMIT,
  buildStakingView,
  decodeCommissionPercent,
  decodeEraIndex,
  decodeRewardPoints,
  decodeSelfStakeTokens,
  loadChainStaking,
  scoreIdToAccount,
  type ChainStaking,
} from "@/lib/staking-inputs";
import {
  eraStorageKey,
  prefixHex,
  storagePrefix,
  twox64ConcatKey,
  blake128ConcatKey,
  type ChainStorage,
} from "@/lib/substrate-rpc";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ALICE = "0x849a279f6c2ad8f0a66953cb89bdeff513b1a4ded437e41cb7dbd69726176b0c";
const BOB = "0xd40a5b57ee622816c3cf13cfb58bbb44c60b2b03f9fc838386816aea05b0ac47";

function memoryStorage(entries: Record<string, string>): ChainStorage {
  const map = new Map(Object.entries(entries).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    async getStorage(key) {
      return map.get(key.toLowerCase()) ?? null;
    },
    async getKeysPaged(prefix) {
      const head = prefix.toLowerCase();
      return [...map.keys()].filter((key) => key.startsWith(head));
    },
    async queryAt(keys) {
      return new Map(keys.map((key) => [key.toLowerCase(), map.get(key.toLowerCase()) ?? null]));
    },
  };
}

function encodePoints(rows: Array<[string, number]>): string {
  const body = [Buffer.alloc(4)];
  body[0].writeUInt32LE(rows.reduce((sum, row) => sum + row[1], 0));
  body.push(Buffer.from([rows.length << 2]));
  for (const [account, points] of rows) {
    const row = Buffer.alloc(36);
    Buffer.from(account.replace(/^0x/, ""), "hex").copy(row);
    row.writeUInt32LE(points, 32);
    body.push(row);
  }
  return `0x${Buffer.concat(body).toString("hex")}`;
}

test("score id is the 32-byte account, unchanged", () => {
  assert.equal(scoreIdToAccount(ALICE.toUpperCase()), ALICE);
  assert.throws(() => scoreIdToAccount("0x849a279f"), /32-byte/);
});

test("decodes commission, self-stake, and reward points", () => {
  assert.equal(decodeEraIndex("0x7100000001"), 113);
  assert.equal(decodeCommissionPercent("0x0000"), 0);
  assert.equal(decodeCommissionPercent("0x025a620200"), 1);
  const ledger =
    "0x849a279f6c2ad8f0a66953cb89bdeff513b1a4ded437e41cb7dbd69726176b0c134d18f2047da4270e134d18f2047da4270e0000";
  const tokens = decodeSelfStakeTokens(ledger);
  assert.ok(tokens > 10199 && tokens < 10200, String(tokens));
  const points = decodeRewardPoints(
    encodePoints([
      [ALICE, 36420],
      [BOB, 35360],
    ]),
  );
  assert.equal(points.get(ALICE), 36420);
  assert.equal(points.get(BOB), 35360);
});

test("mocked RPC: breakdown sums to the v1 score and chills stay unavailable", async () => {
  const era = 64;
  const rewardKey = eraStorageKey(storagePrefix("Staking", "ErasRewardPoints"), era);
  const alice = Buffer.from(ALICE.slice(2), "hex");
  const entries: Record<string, string> = {
    [prefixHex("Staking", "ActiveEra")]: "0x40000000",
    [rewardKey]: encodePoints([
      [ALICE, 100],
      [BOB, 90],
    ]),
    [twox64ConcatKey(storagePrefix("Staking", "Validators"), alice)]: "0x0000",
    [twox64ConcatKey(storagePrefix("Staking", "Bonded"), alice)]: ALICE,
    [blake128ConcatKey(storagePrefix("Staking", "Ledger"), alice)]:
      "0x849a279f6c2ad8f0a66953cb89bdeff513b1a4ded437e41cb7dbd69726176b0c134d18f2047da4270e134d18f2047da4270e0000",
  };
  const chain = await loadChainStaking(memoryStorage(entries), [ALICE]);
  assert.equal(chain.currentEra, 64);
  assert.deepEqual(chain.retainedEras, [64]);
  const view = buildStakingView(chain, ALICE, 64);
  assert.equal(view.input.chills, 0);
  assert.equal(view.input.slashes, 0);
  assert.equal(view.input.commissionPercent, 0);
  assert.ok(view.input.selfStake > 10199);
  assert.equal(view.prunedEras.length, 29);
  assert.equal(view.input.eraPoints.filter((points) => points > 0).length, 1);
  assert.match(view.notes.join(" "), /not available on this chain/);
  assert.equal(scoreValidator(view.input).status, "new");
});

test("thirty recorded eras sum to the displayed v1 score", () => {
  const points = new Map<number, number>();
  const retained: number[] = [];
  for (let era = 35; era <= 64; era++) {
    retained.push(era);
    points.set(era, 1000);
  }
  const chain: ChainStaking = {
    currentEra: 64,
    retainedEras: retained,
    points: new Map([[ALICE, points]]),
    accounts: new Map([
      [ALICE, { commissionPercent: 1, selfStakeTokens: 10199.65, slashEras: [] }],
    ]),
  };
  const view = buildStakingView(chain, ALICE, 64);
  assert.equal(view.prunedEras.length, 0);
  assert.equal(view.input.chills, 0);
  const scored = scoreValidator(view.input);
  assert.equal(scored.status, "scored");
  if (scored.status !== "scored") return;
  assert.equal(totalFromFactors(scored.factors), scored.score);
  assert.equal(scored.factors.find((factor) => factor.id === "chills")?.points, 0);
  assert.equal(scored.factors.find((factor) => factor.id === "uptime")?.points, 0);
});

test("a slash row inside the window is counted", () => {
  const chain: ChainStaking = {
    currentEra: 64,
    retainedEras: [64],
    points: new Map([[ALICE, new Map([[64, 10]])]]),
    accounts: new Map([
      [
        ALICE,
        { commissionPercent: 0, selfStakeTokens: 50_000, slashEras: [64, 1] },
      ],
    ]),
  };
  const view = buildStakingView(chain, ALICE, 64);
  assert.equal(view.input.slashes, 2);
});

test("publish calldata is four words and is not a transaction", () => {
  const data = publishCalldata(ALICE, 64, 96, "A");
  assert.equal(data.length, 2 + 8 + 64 * 4);
  assert.ok(data.startsWith(publishSelectorHex()));
  assert.equal(data.slice(10, 74), ALICE.slice(2));
  assert.equal(BigInt(`0x${data.slice(74, 138)}`), BigInt(64));
  assert.equal(BigInt(`0x${data.slice(138, 202)}`), BigInt(96));
  assert.equal(BigInt(`0x${data.slice(202)}`), BigInt(65));
});

test("SCORING.md records that chills are not available on this chain", () => {
  const doc = readFileSync(path.join(root, "SCORING.md"), "utf8");
  assert.match(doc, /not available on this chain/);
  assert.match(doc, /Chilled/);
  assert.ok(doc.includes(CHILL_LIMIT.slice(0, 40)) || doc.includes("not available on this chain"));
});
