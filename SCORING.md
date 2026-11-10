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

Those numbers were typed in. Running the v1 formula on empty staking fields would be a different calculation, and the live provider does not do that. Until Substrate commission, chills, slashes, era points, and self-stake are read, a published row has no v1 breakdown.

The contract checks the grade band and stores the integer. It does not compute the score. Local resolc 1.4.0 bytecode matches `eth_getCode`. See [contracts/ONCHAIN_MATCH.md](contracts/ONCHAIN_MATCH.md).

## Weight table

Penalty weights sum to 100. A clean validator keeps the base of 100. Each penalty is a share of its weight. Slash has the largest weight because a slash takes nominator stake.

| Factor | Weight | Raw value | Where the raw value comes from | Normalization |
| --- | --- | --- | --- | --- |
| Base score | 100 | 100 | Constant `SCORE_BASE` | Identity. Points +100. |
| Slashes | 40 | Slash count | `Validator.slashes`, the count inside `SLASH_WINDOW_ERAS` (84) | `min(count, 3) / 3`. Full weight at 3 slashes. A fourth slash does not add more. |
| Uptime | 25 | Eras with points &gt; 0 | Last `ERA_POINTS_WINDOW` (30) samples of `Validator.eraPoints`, oldest first. A shorter array leaves the missing eras down. | `1 - upEras / 30`. An era is up when its points are greater than 0. v1 does not scale by the point total. The app has no baseline for a full era's points. |
| Chills | 15 | Chill count | `Validator.chills`, the count inside the 30-era window | `min(count, 10) / 10`. Full weight at 10 chills. Six and nine are both below that cap, so nine costs more. |
| Commission | 15 | Current percent | `Validator.commissionPercent`. 7 means 7%. | No deduction at 5% or below. Full weight at 20% or above. Linear between: `(percent - 5) / 15`. This is the current rate, not the size of the last change. |
| Self-stake | 5 | Whole tokens | `Validator.selfStake`, already in whole tokens (chain amounts use 14 decimals before that conversion) | No deduction at 50,000 tokens or above. Otherwise `1 - tokens / 50000`. |

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

ScorePublished says 100 / A. That value was entered by hand. Commission, chills, slashes, era points, and self-stake for this validator are not read from Substrate yet, so the v1 scorer is not applied on the page. The breakdown shows the on-chain score and says so.

After the next publish, recompute with the CLI from that era's inputs and compare the score and the grade letter to the new ScorePublished log. Open the block events from the Verify on-chain link. The log data word 0 is the score. Word 1 is the grade as an ASCII code (65 A, 66 B, 67 C, 68 D, 70 F). The contract rejects a grade that does not match the bands above. Confirm the deployed bytecode still matches [contracts/ONCHAIN_MATCH.md](contracts/ONCHAIN_MATCH.md) if you need to know the checker has not changed. SHA-256 of the PolkaVM blob checked on 2026-11-05 is `54d7f029c72890269e6f76eb702ec68ad2fa8278609a52d8967d52f97ccdfbb3`.

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
