import type { Metadata } from "next";
import { eventKey, INDEXED_EVENTS } from "@/lib/chain-events";
import { TextLink } from "@/components/text-link";
import {
  BLOCK_TIME_SECONDS,
  CHAIN_ID,
  CHAIN_ID_FROM_ENV,
  ERA39_PUBLISHES,
  ERA_DURATION_HOURS,
  EVM_RPC_URL,
  EXPLORER_URL,
  EXPLORER_URL_FROM_ENV,
  HISTORY_DEPTH_ERAS,
  MIN_ERAS_TO_SCORE,
  NETWORK_NAME,
  NOMINATION_CAP,
  SCORE_REGISTRY_ADDRESS,
  SESSION_BLOCKS,
  SESSIONS_PER_ERA,
  SS58_PREFIX,
  SUBSTRATE_RPC_URL,
  TOKEN_DECIMALS,
  TOKEN_DECIMALS_FROM_ENV,
  TOKEN_SYMBOL,
  TOKEN_SYMBOL_FROM_ENV,
} from "@/lib/config";
import { explorerBlockHref, shortHex } from "@/lib/format";

export const metadata: Metadata = {
  title: "API & contract",
  description: "ScoreRegistry address and the era-39 publish transactions.",
};

const ENDPOINTS = [
  ["NEXT_PUBLIC_CHAIN_ID", CHAIN_ID_FROM_ENV ? String(CHAIN_ID) : ""],
  ["NEXT_PUBLIC_TOKEN_SYMBOL", TOKEN_SYMBOL_FROM_ENV ? TOKEN_SYMBOL : ""],
  [
    "NEXT_PUBLIC_TOKEN_DECIMALS",
    TOKEN_DECIMALS_FROM_ENV ? String(TOKEN_DECIMALS) : "",
  ],
  ["NEXT_PUBLIC_SUBSTRATE_RPC_URL", SUBSTRATE_RPC_URL],
  ["NEXT_PUBLIC_EVM_RPC_URL", EVM_RPC_URL],
  [
    "NEXT_PUBLIC_EXPLORER_URL",
    EXPLORER_URL_FROM_ENV ? EXPLORER_URL : `${EXPLORER_URL} · default`,
  ],
] as const;

export default function ContractPage() {
  return (
    <article className="max-w-3xl">
      <h1>API & contract</h1>
      <p className="mt-2 text-sm text-muted">
        The screens talk to one typed provider,{" "}
        <code className="font-mono text-fg">getDataProvider()</code> in{" "}
        <code className="font-mono text-fg">lib/data.ts</code>. The default
        reads <code className="font-mono text-fg">ScorePublished</code> logs
        from ScoreRegistry.{" "}
        <code className="font-mono text-fg">NEXT_PUBLIC_DATA_SOURCE=mock</code>{" "}
        shows the sample validators.
      </p>

      <section className="card mt-6" id="verify">
        <h2 className="text-lg">Verify on-chain</h2>
        <p className="mt-2 text-sm text-muted">
          ScoreRegistry{" "}
          <code className="font-mono text-fg">{SCORE_REGISTRY_ADDRESS}</code> on{" "}
          {NETWORK_NAME}. Two active-set validators are scored for era 39.
          Each button opens that publish&apos;s block events.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {ERA39_PUBLISHES.map((proof, index) => (
            <TextLink
              key={proof.tx}
              href={explorerBlockHref(proof.block)}
              className={index === 0 ? "btn" : "btn btn-ghost"}
            >
              {index === 0 ? "Verify on-chain" : "Verify second publish"} ↗
            </TextLink>
          ))}
        </div>
        <ul className="mt-4 space-y-2">
          {ERA39_PUBLISHES.map((proof) => (
            <li key={proof.tx} className="font-mono text-xs text-muted break-all">
              block {proof.block} · era {proof.era} · {proof.score}/{proof.grade} ·
              validator {shortHex(proof.validator)} · tx {proof.tx}
            </li>
          ))}
        </ul>
      </section>

      <h2 className="mt-8 text-lg">Chain</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Fact label="Network" value={NETWORK_NAME} />
        <Fact
          label="Chain ID"
          value={
            CHAIN_ID_FROM_ENV
              ? String(CHAIN_ID)
              : `${CHAIN_ID} · confirmed default`
          }
          mono
        />
        <Fact
          label="Token"
          value={
            TOKEN_SYMBOL_FROM_ENV
              ? TOKEN_SYMBOL
              : `${TOKEN_SYMBOL} · confirmed default`
          }
        />
        <Fact
          label="Decimals"
          value={
            TOKEN_DECIMALS_FROM_ENV
              ? String(TOKEN_DECIMALS)
              : `${TOKEN_DECIMALS} · confirmed default`
          }
          mono
        />
        <Fact label="SS58 prefix" value={String(SS58_PREFIX)} mono />
        <Fact label="Block time" value={`${BLOCK_TIME_SECONDS}s`} mono />
        <Fact label="Session" value={`${SESSION_BLOCKS} blocks`} mono />
        <Fact
          label="Era"
          value={`${SESSIONS_PER_ERA} sessions · ~${ERA_DURATION_HOURS}h`}
          mono
        />
        <Fact label="History depth" value={`${HISTORY_DEPTH_ERAS} eras`} mono />
        <Fact label="Eras before a score" value={String(MIN_ERAS_TO_SCORE)} mono />
        <Fact label="Nomination cap" value={`${NOMINATION_CAP} slots · placeholder`} mono />
      </dl>
      <p className="mt-4 text-sm text-muted">
        Scores will be built from mainnet history and published on the testnet
        contract. The two validators in the testnet session set are tagged
        Testnet live and listed next to that history. The nomination cap stays{" "}
        {NOMINATION_CAP} because the staking pallet does not publish
        MaxNominations.
      </p>
      <p className="mt-4 text-sm text-muted">
        H160 account ids on Portaldot are 20-byte account ids. They are not
        Ethereum addresses, even when a wallet displays them with an 0x prefix.
        Do not checksum them as Ethereum, and do not send mainnet ETH to them.
      </p>

      <h2 className="mt-8 text-lg">What the live provider will read</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
        <li>
          <span className="text-fg">Substrate RPC.</span> Staking and session
          state, commission, self-stake, era points, chill events, and slashes.
        </li>
        <li>
          <span className="text-fg">EVM RPC and the score contract.</span> The
          grade, the 0–100 score, the era it was published in, and the
          transaction that wrote it.
        </li>
        <li>
          <span className="text-fg">Nomination.</span> The set builder stops at
          the cap above. Signing a real staking.nominate call comes after the
          wallet is connected. The button on the review step does not broadcast.
        </li>
      </ul>

      <h2 className="mt-8 text-lg">Endpoints</h2>
      <p className="mt-2 text-sm text-muted">
        Copy <code className="font-mono text-fg">.env.example</code> to{" "}
        <code className="font-mono text-fg">.env.local</code>. That file has
        the official V3 endpoints. Unset chain id, symbol, decimals, and the
        explorer origin fall back to the confirmed defaults. Verify links open{" "}
        <code className="font-mono text-fg">#/blocks/&#123;height&#125;?tab=events</code>{" "}
        on the V3 scanner. Point{" "}
        <code className="font-mono text-fg">NEXT_PUBLIC_EXPLORER_URL</code> at
        the node console and the same buttons use{" "}
        <code className="font-mono text-fg">#/explorer/query/&#123;block&#125;</code>.{" "}
        <code className="font-mono text-fg">/tx/&#123;hash&#125;</code> on that
        console is not a transaction page.
      </p>
      <ul className="mt-4 space-y-2">
        {ENDPOINTS.map(([name, value]) => (
          <li key={name} className="card flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <code className="font-mono text-xs text-fg">{name}</code>
            <span className="font-mono text-xs text-muted">
              {value ? value : "Not set"}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg">Indexer events</h2>
      <p className="mt-2 text-sm text-muted">
        Field order for the events a later indexer will decode. Nothing
        subscribes to these yet.
      </p>
      <ul className="mt-4 space-y-2">
        {INDEXED_EVENTS.map((event) => (
          <li
            key={eventKey(event)}
            className="card flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
          >
            <code className="font-mono text-xs text-fg">{eventKey(event)}</code>
            <span className="font-mono text-xs text-muted">
              {event.fields.join(", ")}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="card">
      <dt className="k">{label}</dt>
      <dd className={`mt-1 ${mono ? "font-mono text-lg" : "text-lg"}`}>{value}</dd>
    </div>
  );
}
