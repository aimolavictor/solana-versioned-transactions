# Testing

Every example runs in-process with no network and no SOL, and passes deterministically. A reviewer can clone the repo and watch them go green in seconds.

## Why in-process
Devnet faucets rate-limit and live slots are slow. An in-process Solana VM gives instant funding and deterministic results, in CI.
- **solana-bankrun** speaks web3.js v1 and pairs with the `@solana/web3.js` builders the examples use.
- **litesvm** speaks `@solana/kit` (web3.js v2). Use it for kit codebases.

```bash
cd examples
npm install
npm test
```

## The pattern
```ts
import { start } from 'solana-bankrun';

const context = await start([], []);
const client = context.banksClient;
const payer = context.payer;          // pre-funded, no faucet

// advance slots for lookup-table timing:
context.warpToSlot(10n);
```

Read a lookup table back in-process, no RPC:
```ts
const raw = await client.getAccount(altAddress);
const state = AddressLookupTableAccount.deserialize(Buffer.from(raw.data));
```

## One thing a VM cannot model
Closing a deactivated lookup table requires the roughly 513-slot cooldown to age the deactivation slot out of the SlotHashes sysvar. An in-process VM jumps the clock without simulating hundreds of real slot hashes, so the final close is verified on a live cluster, not asserted in the suite. `examples/03` tests everything up to that point (an active table cannot be closed, deactivation works) and does not fake a green check for what the VM cannot prove. That restraint is the point: the suite only asserts what it can actually verify.

## What's covered
| Example | Proves |
|---|---|
| `01-lookup-table.bankrun.ts` | create + extend a table, build a v0 tx that resolves an address through it |
| `02-compute-budget.bankrun.ts` | a too-low CU limit fails, priority fee + sufficient limit passes, the rent-exempt trap |
| `03-deactivate-table.bankrun.ts` | active tables cannot be closed, deactivation works |
