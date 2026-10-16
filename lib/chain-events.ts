/**
 * Events the future indexer will decode.
 *
 * Names and field order match the V3 testnet notes. This module does
 * not subscribe to the node. SlashReported was listed with the staking
 * events and had no separate pallet prefix, so it is recorded as Staking.
 */

export interface ChainEventSpec {
  readonly pallet: string;
  readonly name: string;
  readonly fields: readonly string[];
}

export const INDEXED_EVENTS = [
  { pallet: "Staking", name: "Slashed", fields: ["staker", "amount"] },
  {
    pallet: "Staking",
    name: "SlashReported",
    fields: ["validator", "fraction", "slash_era"],
  },
  { pallet: "Staking", name: "Chilled", fields: ["stash"] },
  { pallet: "Staking", name: "Kicked", fields: ["nominator", "stash"] },
  { pallet: "Staking", name: "Rewarded", fields: ["stash", "dest", "amount"] },
  {
    pallet: "Staking",
    name: "EraPaid",
    fields: ["era_index", "validator_payout", "remainder"],
  },
  { pallet: "Staking", name: "ValidatorPrefsSet", fields: ["stash", "prefs"] },
  { pallet: "Session", name: "ValidatorDisabled", fields: ["validator"] },
  { pallet: "Offences", name: "Offence", fields: ["kind", "slot"] },
] as const satisfies readonly ChainEventSpec[];

export type IndexedEvent = (typeof INDEXED_EVENTS)[number];

export function eventKey(event: Pick<ChainEventSpec, "pallet" | "name">): string {
  return `${event.pallet}.${event.name}`;
}
