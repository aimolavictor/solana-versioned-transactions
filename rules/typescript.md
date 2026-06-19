---
name: typescript
description: TypeScript conventions for Solana versioned transactions, lookup tables, and compute budget
---

# TypeScript conventions for versioned transactions

## Lookup tables
- `createLookupTable` needs a recent slot from `connection.getSlot()`. Do not pass an arbitrary number; it is checked against SlotHashes.
- Never use a table in the same slot you extended it. Wait a slot.
- Fetch a table with `connection.getAddressLookupTable(address)` and use `.value`, which is null if it does not exist. Guard it.
- A table holds at most 256 addresses. Extend in batches.

## Versioned transactions
- Build with `new TransactionMessage(...).compileToV0Message([...lookupTableAccounts])`, wrap in `VersionedTransaction`, sign with an array: `tx.sign([payer])`.
- Check `message.addressTableLookups` to confirm a table was actually used.

## Compute budget
- `setComputeUnitLimit({ units })` sized to the work. Simulate first to learn the units, then add a margin.
- `setComputeUnitPrice({ microLamports })` for priority. The fee is `units * price`, so do not oversize the limit.

## Common failures
- "insufficient funds for rent": a transfer left a new account below the rent-exempt minimum (~890,880 lamports). Send a rent-exempt amount.
- compute-budget error: the limit was below what the instructions consumed.
- lookup fails or table not found: used too early (same slot as the extend), or fetched with `.value` unchecked.

## Style
- Prefer `@solana/kit` for new code. The examples use `@solana/web3.js` 1.98.x with solana-bankrun for tests.
- Prettier, ESLint, conventional commits.
