import type { Metadata } from "next";
import {
  CHAIN_ID,
  CHAIN_ID_FROM_ENV,
  EVM_RPC_URL,
  EXPLORER_URL,
  MIN_ERAS_TO_SCORE,
  NETWORK_NAME,
  NOMINATION_CAP,
  SUBSTRATE_RPC_URL,
  TOKEN_DECIMALS,
  TOKEN_DECIMALS_FROM_ENV,
  TOKEN_DISPLAY_SYMBOL,
  TOKEN_SYMBOL,
  TOKEN_SYMBOL_FROM_ENV,
} from "@/lib/config";

export const metadata: Metadata = {
  title: "API & contract",
  description: "How Vetted will read Portaldot scores, and what is mocked today.",
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
  ["NEXT_PUBLIC_EXPLORER_URL", EXPLORER_URL],
] as const;

export default function ContractPage() {
  return (
    <article className="max-w-3xl">
      <h1>API & contract</h1>
      <p className="mt-2 text-sm text-muted">
        The screens talk to one typed provider,{" "}
        <code className="font-mono text-fg">getDataProvider()</code> in{" "}
        <code className="font-mono text-fg">lib/data.ts</code>. Today that
        returns mock report cards. Replacing the provider is the whole
        integration.
      </p>

      <h2 className="mt-8 text-lg">Chain</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Fact label="Network" value={NETWORK_NAME} />
        <Fact
          label="Chain ID"
          value={
            CHAIN_ID_FROM_ENV
              ? String(CHAIN_ID)
              : `${CHAIN_ID} · unconfirmed placeholder`
          }
          mono
        />
        <Fact
          label="Token"
          value={
            TOKEN_SYMBOL_FROM_ENV
              ? TOKEN_SYMBOL
              : `${TOKEN_SYMBOL} (${TOKEN_DISPLAY_SYMBOL} on cards) · placeholder`
          }
        />
        <Fact
          label="Decimals"
          value={
            TOKEN_DECIMALS_FROM_ENV
              ? String(TOKEN_DECIMALS)
              : `${TOKEN_DECIMALS} · placeholder`
          }
          mono
        />
        <Fact label="Eras before a score" value={String(MIN_ERAS_TO_SCORE)} mono />
        <Fact label="Nomination cap" value={`${NOMINATION_CAP} slots · placeholder`} mono />
      </dl>
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
        <code className="font-mono text-fg">.env.local</code>. Portaldot has not
        confirmed the V3 testnet RPC or chain id, so empty values are expected.
        Unset chain id, symbol, and decimals fall back to the placeholders
        documented in that file. &quot;View on-chain&quot; links open the
        explorer when <code className="font-mono text-fg">NEXT_PUBLIC_EXPLORER_URL</code>{" "}
        is set, and stay on this page until then.
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
