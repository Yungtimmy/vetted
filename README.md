# Vetted

Validator risk report cards for the Portaldot network. Built for Portaldot Hacker House / DoraHacks, Node Ops & Tooling.

Each era, Vetted scores a validator from 0 to 100 and publishes that score on-chain. This app is the nominator-facing dashboard: a leaderboard, a per-validator report card, and a flow for building a safer nomination set. **The chain is not connected.** Portaldot has not confirmed the V3 testnet RPC or chain id, and the previous wss endpoint is down. Every number on screen comes from a typed mock provider.

## Screens

| Route | What it shows |
| --- | --- |
| `/` | Leaderboard. Grade, 0–100 score, commission, slashes, chills, era-point sparkline. Search, filter, and sort. Cards replace the table on narrow screens. |
| `/validator/[id]` | Report card. Scored validators get a point-by-point breakdown, history, and a rewards chart. Validators with fewer than 28 eras get the "Not enough history" state and are never graded F for being new. |
| `/nominate` | Card grid plus a sticky "Your set" panel. The nomination cap stays 16, the placeholder `NOMINATION_CAP` in `lib/config.ts`. Review and the wallet step are mocked. |
| `/methodology` | How the score is explained. |
| `/contract` | Chain constants and the plan for swapping in live reads. |

## Stack

Next.js (App Router), TypeScript, Tailwind CSS. It deploys on the Vercel free tier: Node.js runtime, no Edge runtime, no paid platform features. `npm run build` prerenders the mock pages. Below the `xl` breakpoint the leaderboard switches from the table to cards so a phone does not scroll sideways.

## Setup

```bash
npm install
cp .env.example .env.local   # optional; the URLs can stay empty
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

Fonts are loaded with `next/font`: Space Grotesk for headings, Inter for body text, JetBrains Mono for numbers and addresses. The accent is teal `#2DD4BF`. Grade colors are A green, B lime, C yellow, D orange, F red, and NEW slate.

## Data layer

Pages do not import mock rows. They call `getDataProvider()` from `lib/data.ts`.

| File | Role |
| --- | --- |
| `lib/types.ts` | `Validator`, `NetworkOverview`, and `ValidatorDataProvider`. |
| `lib/config.ts` | Env-driven chain id, RPCs, and token settings, plus the nomination-cap placeholder. |
| `lib/mock-provider.ts` | The nine sample validators and the network stats from the mockup. |
| `lib/scoring.ts` | Grade bands, stake-weighted set score, nomination warnings. |
| `lib/format.ts` | Address shortening, era and token formatting, explorer links. |
| `lib/data.ts` | Returns the provider. This is the file to edit when going live. |

The mock overview (142 scored, 38 graded A, 6 slashed, 5.0% median commission) is the network snapshot from the design. The table is a nine-validator sample, including Harmattan Node as NEW.

## Swapping in the chain

Leave the React screens alone. Implement `ValidatorDataProvider` and return it from `getDataProvider()`.

1. **Substrate RPC** (`NEXT_PUBLIC_SUBSTRATE_RPC_URL`). Read staking and session state: commission, self-stake, era points, chill events, and slashes. Map them into the existing `Validator` fields.
2. **EVM RPC** (`NEXT_PUBLIC_EVM_RPC_URL`) **and the score contract.** Read the published grade, the 0–100 score, the era, and the transaction that wrote it. The on-chain score replaces the mock `factors` total. Keep the breakdown as a view over the same events the contract used.
3. **Amounts.** Set `NEXT_PUBLIC_TOKEN_SYMBOL` and `NEXT_PUBLIC_TOKEN_DECIMALS`. When they are unset the app falls back to the unconfirmed placeholders `tPOTv3` and **14 decimals**, and report cards keep the short label `tPOT`. Convert chain balances at the edge of the provider so components keep receiving whole-token numbers (or switch them to bigint strings in one place, `selfStake`).
4. **Addresses.** SS58 is the display id on the card. H160 values are 20-byte Portaldot account ids. **They are not Ethereum addresses.** Do not EIP-55 checksum them and do not treat them as mainnet accounts.
5. **Chain id and RPCs.** Set `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_SUBSTRATE_RPC_URL`, and `NEXT_PUBLIC_EVM_RPC_URL` once Portaldot publishes them. Unset chain id falls back to `420420777`, which is not confirmed. `NOMINATION_CAP` stays **16** in `lib/config.ts` until the staking pallet's limit is read. `MIN_ERAS_TO_SCORE` (28) is still a placeholder. `CURRENT_ERA` should come from the staking pallet.
6. **Explorer links.** Set `NEXT_PUBLIC_EXPLORER_URL` (no trailing slash). "View score on-chain" and "View on Portaldot explorer" append `/tx/<hash>`. Until that variable is set, both links stay inside the app on `/contract`.
7. **Signing.** "Sign in your wallet" does not submit an extrinsic. Wire a wallet, then call the staking nominate extrinsic with the selected set and the bond amount. The mock success tx is `MOCK_NOMINATION_TX` in `lib/config.ts`.

Copy `.env.example` to `.env.local`. Leave the RPC URLs empty until an endpoint exists. The commented placeholders in that file are what the app uses when a variable is unset.

## Not in this scaffold

Live scores, a connected wallet, and a real `staking.nominate` extrinsic. Filters, search, sort, the set builder, and the three nominate steps all run on the mock provider.
