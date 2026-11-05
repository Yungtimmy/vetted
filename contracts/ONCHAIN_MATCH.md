# ScoreRegistry on-chain bytecode match

**Result: PASS.** The PolkaVM blob from `npm run compile:resolc` is byte-for-byte identical to `eth_getCode` for ScoreRegistry on PortaldotV3 Test.

Checked 2026-11-05. Nothing was redeployed.

| | |
| --- | --- |
| Chain id | `420420777` (`eth_chainId` = `0x190f1ca9`) |
| RPC | `https://test-evm-rpc-v3.portaldot.dev` |
| Address | `0xeebc363c7af7ed8e888da07e959043517ae4b97d` |
| Compiler | `@parity/resolc@1.4.0` (`1.4.0+commit.ca3c770.llvm-22.1.5`) |
| Command | `npm run compile:resolc` (optimizer `{enabled: true, mode: "z"}`, no `runs`) |
| Bytes | 4995 |
| Prefix | `0x50564d00` (`PVM\0`, PolkaVM blob version 0) |
| SHA-256 | `54d7f029c72890269e6f76eb702ec68ad2fa8278609a52d8967d52f97ccdfbb3` |
| keccak256 | `0x766dcd6b747b4dbad90916749677beb0ab2df7c481642b98ea9fa9485d2c83b3` |

## Compare method

`eth_getCode` returns the whole PolkaVM program, not EVM bytecode. Revive stores constructor and runtime in that one blob, so resolc's `evm.bytecode.object` (written to `build/ScoreRegistry.polkavm`) is the on-chain artifact. Compare those raw bytes. Do not strip a header.

The blob is `PVM\0`, a version byte `0`, then a little-endian u64 length that equals the file size (`0x1383` = 4995), then the memory, import, export, and code sections. Both sides are the same file, so every section matches.

`package.json` pins `@parity/resolc` to `1.4.0`. That was the release current when this source was committed (2026-10-27). `1.5.0` was published the next day. A caret range `^1.4.0` now installs `1.5.0`, which emits 4911 bytes (SHA-256 `606dfc846d6b05d5f184dfb2b7344564f674c499f24ee32746299257c51f1517`) and does not match. Memory and import sections still match; the code section does not.

`npm test` compiles the same Solidity with solc 0.8.28 and checks grade bands on an EVM chain. That init code is 746 bytes. It is not the code stored on Portaldot.

## Re-run

```bash
cd contracts
npm install
node --input-type=module -e "import('@parity/resolc').then(m => console.log(m.version()))"
# 1.4.0+commit.ca3c770.llvm-22.1.5

npm run compile:resolc
# mode z size 4995 bytes

curl -sS -X POST https://test-evm-rpc-v3.portaldot.dev \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
# {"jsonrpc":"2.0","id":1,"result":"0x190f1ca9"}

curl -sS -X POST https://test-evm-rpc-v3.portaldot.dev \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0xeebc363c7af7ed8e888da07e959043517ae4b97d","latest"]}' \
  -o /tmp/getcode.json

node --input-type=module -e '
import fs from "fs";
import crypto from "crypto";
const on = Buffer.from(JSON.parse(fs.readFileSync("/tmp/getcode.json","utf8")).result.slice(2), "hex");
const local = fs.readFileSync("build/ScoreRegistry.polkavm");
const sha = (b) => crypto.createHash("sha256").update(b).digest("hex");
console.log("bytes", local.length, on.length);
console.log("prefix", local.subarray(0, 4).toString("hex"), on.subarray(0, 4).toString("hex"));
console.log("sha256 local", sha(local));
console.log("sha256 chain", sha(on));
console.log(local.equals(on) ? "PASS" : "FAIL");
'
```

Expected last line: `PASS`. Both SHA-256 lines are `54d7f029c72890269e6f76eb702ec68ad2fa8278609a52d8967d52f97ccdfbb3`.
