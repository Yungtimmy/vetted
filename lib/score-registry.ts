import { cacheLife } from "next/cache";
import {
  EVM_RPC_URL,
  RPC_USER_AGENT,
  SCORE_REGISTRY_ADDRESS,
  SCORE_REGISTRY_FROM_BLOCK,
} from "@/lib/config";

/** keccak256("ScorePublished(bytes32,uint256,uint256,uint256)") */
export const SCORE_PUBLISHED_TOPIC =
  "0x26163a5ef449f7833711c49fda0388d980101cb3a604183507ee5a4b855abf91";

/** One ScorePublished log, decoded. */
export interface PublishedScore {
  /** 32-byte account id, 0x-prefixed lowercase hex. */
  validator: string;
  era: number;
  score: number;
  /** Grade letter decoded from its ASCII code. */
  grade: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
}

interface RpcLog {
  topics: string[];
  data: string;
  transactionHash: string;
  blockNumber: string;
  logIndex: string;
  removed?: boolean;
}

function word(hex: string, index: number): bigint {
  const body = hex.startsWith("0x") ? hex.slice(2) : hex;
  const chunk = body.slice(index * 64, index * 64 + 64);
  if (chunk.length !== 64) throw new Error("ScorePublished data is too short");
  return BigInt(`0x${chunk}`);
}

export function decodeScoreLog(log: RpcLog): PublishedScore {
  if (log.topics.length < 3 || log.topics[0].toLowerCase() !== SCORE_PUBLISHED_TOPIC) {
    throw new Error("Not a ScorePublished log");
  }
  const gradeCode = Number(word(log.data, 1));
  return {
    validator: log.topics[1].toLowerCase(),
    era: Number(BigInt(log.topics[2])),
    score: Number(word(log.data, 0)),
    grade: String.fromCharCode(gradeCode),
    txHash: log.transactionHash,
    blockNumber: Number(BigInt(log.blockNumber)),
    logIndex: Number(BigInt(log.logIndex)),
  };
}

/** Latest score per validator: the log with the highest era wins. */
export function latestByValidator(logs: PublishedScore[]): PublishedScore[] {
  const latest = new Map<string, PublishedScore>();
  for (const log of logs) {
    const current = latest.get(log.validator);
    if (
      !current ||
      log.era > current.era ||
      (log.era === current.era &&
        (log.blockNumber > current.blockNumber ||
          (log.blockNumber === current.blockNumber && log.logIndex > current.logIndex)))
    ) {
      latest.set(log.validator, log);
    }
  }
  return [...latest.values()];
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(EVM_RPC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": RPC_USER_AGENT,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`${method} failed with HTTP ${response.status}`);
  const body = (await response.json()) as { result?: T; error?: { message: string } };
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result as T;
}

/** Every ScorePublished log from the deploy block to the head. Cached for a minute. */
export async function fetchPublishedScores(): Promise<PublishedScore[]> {
  "use cache";
  cacheLife("minutes");
  const logs = await rpc<RpcLog[]>("eth_getLogs", [
    {
      address: SCORE_REGISTRY_ADDRESS,
      fromBlock: `0x${SCORE_REGISTRY_FROM_BLOCK.toString(16)}`,
      toBlock: "latest",
      topics: [SCORE_PUBLISHED_TOPIC],
    },
  ]);
  return logs.filter((log) => !log.removed).map(decodeScoreLog);
}
