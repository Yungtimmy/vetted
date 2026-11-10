# Scoring

**v1 proposed, pending founder approval.**

This file is the scoring config for `lib/scorer.ts`. The weights below are a proposal. They did not produce the scores already stored in ScoreRegistry.

## Published eras were entered by hand

Eras published before this version were entered manually. The next publish will use the v1 scorer. This repository does not send a `publish` transaction.

| Record | What was stored |
| --- | --- |
| Era 39, block [144339](https://scanner-testnet-v3.portaldot.dev/#/blocks/144339?tab=events), tx `0x76a7bd7259f660c546c1532a46ba79d353e1df5121d11fbcc8838f836c969dcf` | Validator `0x849a279f6c2ad8f0a66953cb89bdeff513b1a4ded437e41cb7dbd69726176b0c`, score 100, grade A |
| Era 39, block [144343](https://scanner-testnet-v3.portaldot.dev/#/blocks/144343?tab=events), tx `0xf197cb76814284676fb41ee3cad7e07452a309adab6f1a1616608d41de6e874d` | Validator `0xd40a5b57ee622816c3cf13cfb58bbb44c60b2b03f9fc838386816aea05b0ac47`, score 100, grade A |
| Era 64, block [234726](https://scanner-testnet-v3.portaldot.dev/#/blocks/234726?tab=events), tx `0xbb5f03f2f0c16c27a1fba61e47953252b839f30dbcef0ba1992ba1a65a04af8a` | Same `0x849a279f…` validator, score 100, grade A |
| Era 64, block [234727](https://scanner-testnet-v3.portaldot.dev/#/blocks/234727?tab=events), tx `0x045bfa8c6b17ca8b08b3d5ac91e51443194de4420d03a61e63ab9004163ddd59` | Same `0xd40a5b57…` validator, score 100, grade A |
| `contracts/scripts/sample-publish.js` | Era 1284, score 88, grade A, written into a local calldata file. The script passes `88` directly. |

Those numbers were typed in. The live page now runs the v1 scorer on Substrate inputs for that era and shows the breakdown next to the published score. When the two numbers differ, the card says the published era was entered by hand.

The contract checks the grade band and stores the integer. It does not compute the score. Local resolc 1.4.0 bytecode matches `eth_getCode`. See [contracts/ONCHAIN_MATCH.md](contracts/ONCHAIN_MATCH.md).

## Weight table

Penalty weights sum to 100. A clean validator keeps the base of 100. Each penalty is a share of its weight. Slash has the largest weight because a slash takes nominator stake.

| Factor | Weight | Raw value | Where the raw value comes from | Normalization |
| --- | --- | --- | --- | --- |
| Base score | 100 | 100 | Constant `SCORE_BASE` | Identity. Points +100. |
| Slashes | 40 | Slash count | `Validator.slashes`, the count inside `SLASH_WINDOW_ERAS` (84) | `min(count, 3) / 3`. Full weight at 3 slashes. A fourth slash does not add more. |
| Uptime | 25 | Eras with points &gt; 0 | Last `ERA_POINTS_WINDOW` (30) samples of `Validator.eraPoints`, oldest first. A shorter array leaves the missing eras down. | `1 - upEras / 30`. An era is up when its points are greater than 0. v1 does not scale by the point total. The app has no baseline for a full era's points. |
| Chills | 15 | Chill count | `Validator.chills`. On this testnet the count is not available on this chain: `Staking.Chilled` is an event and `System.Events` is not indexed. The reader passes 0 and the breakdown raw value says so. | `min(count, 10) / 10`. Full weight at 10 chills. Six and nine are both below that cap, so nine costs more. |
| Commission | 15 | Current percent | `Staking.Validators` prefs, compact Perbill. 7 means 7%. This is the head value, including when the scored era is older. | No deduction at 5% or below. Full weight at 20% or above. Linear between: `(percent - 5) / 15`. |
| Self-stake | 5 | Whole tokens | `Staking.Ledger.active` for the `Staking.Bonded` controller, divided by 10^14. Head value. | No deduction at 50,000 tokens or above. Otherwise `1 - tokens / 50000`. |

`Validator.stakeWeight` is only the nomination-set weight. It is not a term in this score.

The history list on a card is not an input. The scorer reads the count fields. On the sample cards, Delta Stake has 6 chills and 3 chill rows, and Rogue Ops has 9 chills and 1 chill row. Recounting the list will not match the score.

## Rollup

1. Exact deduction for a factor is `weight × normalized fraction`.
2. `target = Math.round(sum of exact deductions)`. `Math.round` uses half towards +∞.
3. Each factor starts at `Math.floor(exact)`.
4. Leftover points (`target - sum of floors`) go one each to the largest fractional parts. A tie goes to the earlier factor in this order: uptime, slashes, chills, commission, self-stake.
5. Points for a penalty are the negation of that integer share. The base contributes +100.
6. Score = sum of the signed points. That sum is the 0–100 score. With these weights the sum stays inside 0–100.

Division uses IEEE-754 numbers, the same as the TypeScript implementation.

## Grades

The first band that fits wins. These are the same cuts `ScoreRegistry.publish` requires.

| Grade | Score |
| --- | --- |
| A | 85–100 |
| B | 65–84 |
| C | 50–64 |
| D | 30–49 |
| F | 0–29 |

## New validators

`activeEras` below `MIN_ERAS_TO_SCORE` (28) returns grade NEW and no score. The factor list is empty. A short history is not an F.

## Worked example, sample inputs

Kola Staking in the sample set. These inputs are fixture fields, not a ScorePublished record.

| Input | Value |
| --- | --- |
| Active eras | 190 |
| Era points | 30 of 30 above 0 |
| Slashes | 1 |
| Chills | 2 |
| Commission | 7% |
| Self-stake | 18,000 |

Exact deductions:

| Factor | Expression | Exact |
| --- | --- | --- |
| Uptime | 25 × (1 − 30/30) | 0 |
| Slashes | 40 × (1/3) | 13.333… |
| Chills | 15 × (2/10) | 3 |
| Commission | 15 × ((7 − 5) / 15) | 2 |
| Self-stake | 5 × (1 − 18000/50000) | 3.2 |

Sum of exact deductions = 21.533…. `Math.round` yields 22.

Floors are 0, 13, 3, 2, 3 (sum 21). One leftover point goes to the slash term, which has the largest fraction.

| Factor | Weight | Raw | Points |
| --- | --- | --- | --- |
| Base score | 100 | 100 | +100 |
| Uptime | 25 | 30/30 | 0 |
| Slashes | 40 | 1 | −14 |
| Chills | 15 | 2 | −3 |
| Commission | 15 | 7% | −2 |
| Self-stake | 5 | 18,000 | −3 |
| Total | | | 78 |

78 is a B (at least 65, below 85).

The same inputs through the CLI:

```bash
npm run score -- --active-eras 190 --commission 7 --chills 2 --slashes 1 --self-stake 18000 --up-eras 30
```

`--up-eras 30` means thirty eras up and the rest of the window down. `--era-points` takes an explicit comma-separated list instead.

A clean input (30 eras up, commission at or below 5%, no chills, no slashes, self-stake at or above 50,000, at least 28 active eras) scores 100 / A. Lagos Validator and Abuja Secure in the sample set are in that group. Their sparkline numbers are all above zero, so the uptime term is 0 there too.

Six chills on an otherwise clean validator deduct 9. Nine chills deduct 14. The old sample cards used −18 for both.

## Worked example, a published era

Validator `0x849a279f6c2ad8f0a66953cb89bdeff513b1a4ded437e41cb7dbd69726176b0c`, era 64, block 234726, tx `0xbb5f03f2f0c16c27a1fba61e47953252b839f30dbcef0ba1992ba1a65a04af8a`.

ScorePublished says 100 / A. That value was entered by hand. The page also shows the v1 breakdown from `lib/staking-inputs.ts` for era 64. Recompute it with:

```bash
npm run score -- --live --era 64
```

`--era current` uses `Staking.ActiveEra`. The command prints `publish(...)` calldata and does not send it.

## Chain read

`lib/staking-inputs.ts` talks to `wss://test-node-v3.portaldot.dev` over HTTP JSON-RPC, the same way `lib/session-validators.ts` reads `Session.Validators`.

The ScoreRegistry id is the 32-byte AccountId. The active set stores those same bytes. `scoreIdToAccount` only normalizes the hex. It does not truncate to 20 bytes.

| Input | Storage | Limit |
| --- | --- | --- |
| Era points | `Staking.ErasRewardPoints`, Twox64Concat era, map of AccountId to u32 | Kept for `HistoryDepth` (84). Eras older than the oldest stored record are pruned. The v1 window has no unknown state, so a pruned era is 0 and counts as down. |
| Slashes | `Staking.ValidatorSlashInEra` and `Staking.UnappliedSlashes` | Count of rows for that stash inside the 84-era window. `SlashingSpans` and `Offences.Reports` can name a stash without a slash era. Those rows are not counted. |
| Chills | `Staking.Chilled` events | Not available on this chain. The event is not indexed, and a 30-era window is about 108,000 blocks. The scorer receives 0. The breakdown raw value says not available on this chain. |
| Commission | `Staking.Validators`, Twox64Concat stash | Current preference. |
| Self-stake | `Staking.Bonded` then `Staking.Ledger` (Blake2_128Concat on the controller) | `active`, whole tPOT, at the head. |
| Active eras | Count of retained reward-point eras with points above 0 | Lifetime before `HistoryDepth` is gone. 28 or more retained eras is enough to leave NEW. |

After the next publish, compare the CLI score and grade with the new ScorePublished log.

### Read on 2026-11-10

`Staking.ActiveEra` was 114. `ErasRewardPoints` still held eras 30–114 (85 eras). Era 39 and era 64 are inside that range. The era-39 uptime window starts at era 10, so eras 10–29 are pruned and the v1 rule counts them as down. Era 64 and era 114 windows sit entirely inside 30–114. Both active-set accounts had points in every retained era of those windows. `ValidatorSlashInEra` and `UnappliedSlashes` had no rows. Chills are not available on this chain. Commission and self-stake are the head values (about 10,200 tPOT, under the 50,000 full-marks line).

| Era | Account | Published | v1 | Uptime | Slashes | Chills | Commission | Self-stake |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 39 | `0x849a279f…` | 100/A | 79/B | 10/30, −17 | 0 | not available on this chain, 0 | 0% | 10,201.37, −4 |
| 39 | `0xd40a5b57…` | 100/A | 79/B | 10/30, −17 | 0 | not available on this chain, 0 | 1% | 10,200.23, −4 |
| 64 | `0x849a279f…` | 100/A | 96/A | 30/30, 0 | 0 | not available on this chain, 0 | 0% | 10,201.37, −4 |
| 64 | `0xd40a5b57…` | 100/A | 96/A | 30/30, 0 | 0 | not available on this chain, 0 | 1% | 10,200.23, −4 |
| 114 | `0x849a279f…` | none | 96/A | 30/30, 0 | 0 | not available on this chain, 0 | 0% | 10,201.37, −4 |
| 114 | `0xd40a5b57…` | none | 96/A | 30/30, 0 | 0 | not available on this chain, 0 | 1% | 10,200.23, −4 |

The gap versus 100/A is the self-stake term, plus pruned uptime on era 39. `npm run score -- --live --era 64` reprints the era-64 rows. The era number moves as the chain produces eras. Open the block events from the Verify on-chain link. The log data word 0 is the score. Word 1 is the grade as an ASCII code (65 A, 66 B, 67 C, 68 D, 70 F). The contract rejects a grade that does not match the bands above. Confirm the deployed bytecode still matches [contracts/ONCHAIN_MATCH.md](contracts/ONCHAIN_MATCH.md) if you need to know the checker has not changed. SHA-256 of the PolkaVM blob checked on 2026-11-05 is `54d7f029c72890269e6f76eb702ec68ad2fa8278609a52d8967d52f97ccdfbb3`.

## Config hash

SHA-256 of the UTF-8 canonical JSON of the numeric config. Object keys are sorted at every level. Arrays keep the order in `SCORING_CONFIG`. There is no whitespace. The status sentence is not part of the hash.

```
7c487240c4e4acda68c998c7379d6273b7ba5b3182d89dfc17d141e160cc5508
```

```json
{"base":100,"eraPointsWindow":30,"factors":[{"id":"uptime","weight":25},{"fullPenaltyCount":3,"id":"slashes","weight":40},{"fullPenaltyCount":10,"id":"chills","weight":15},{"freePercent":5,"fullPenaltyPercent":20,"id":"commission","weight":15},{"fullTokens":50000,"id":"selfStake","weight":5}],"formulaVersion":"v1","gradeBands":[{"grade":"A","minScore":85},{"grade":"B","minScore":65},{"grade":"C","minScore":50},{"grade":"D","minScore":30},{"grade":"F","minScore":0}],"minErasToScore":28,"rollup":"base-minus-largest-remainder","scaleMax":100,"scaleMin":0,"slashWindowEras":84}
```

Reprint it from the code:

```bash
npm run score -- --hash
```

`lib/scoring-hash.ts` exports `SCORING_CONFIG_SHA256`.
