---
name: solana-versioned-transactions
description: Versioned (v0) transactions, Address Lookup Tables, and the compute budget on Solana. Build transactions that fit more accounts, set compute-unit limits and priority fees, and manage lookup-table lifecycle. Covers the gotchas that break most attempts: the recent-slot requirement, the lookup-table warm-up delay, the rent-exempt minimum on transfers, and the deactivation cooldown.
user-invocable: true
---

# Solana Versioned Transactions and Lookup Tables

A legacy Solana transaction caps at a small number of accounts and has no native fee priority. Versioned (v0) transactions plus Address Lookup Tables (ALTs) raise the account ceiling, and the compute budget program sets limits and priority fees. This skill covers all three, and every pattern is backed by a passing test in [`examples/`](../examples) that runs with no network and no SOL.

When you generate code, you mirror those tested patterns. You do not invent API shapes.

## When to use what
- **Legacy transaction:** a handful of accounts, no fee priority. Simplest.
- **v0 transaction:** when you need a lookup table, or just want a clean transaction format that compute-budget and priority-fee instructions slot into.
- **Address Lookup Table:** when a transaction references many accounts (a DeFi route across several pools, a batched payout) and would blow past the legacy account limit. The table stores the addresses once on-chain; the transaction references them by a one-byte index.
- **Compute budget instructions:** raise the compute-unit limit for heavy instructions, and attach a priority fee with `setComputeUnitPrice`.

## The gotchas (read before writing code)
1. **createLookupTable needs a recent slot** that exists in the SlotHashes sysvar. Use a current or just-past slot, not an arbitrary number. (examples/01)
2. **A table is not usable until a slot passes after the extend.** Add the addresses, then build the v0 transaction in a later slot. Use it too early and the lookup fails. (examples/01)
3. **Rent-exempt minimum.** Transferring below ~890,880 lamports (a 0-byte account) to a brand-new account fails with "insufficient funds for rent". (examples/02)
4. **A too-low compute-unit limit fails the whole transaction.** Size the limit to what the instructions actually consume. (examples/02)
5. **You cannot close an active table.** Deactivate it, wait the ~513-slot cooldown, then close to reclaim the rent. (examples/03)

## Default stack (June 2026)
- `@solana/web3.js` 1.98.x: `TransactionMessage`, `VersionedTransaction`, `AddressLookupTableProgram`, `AddressLookupTableAccount`, `ComputeBudgetProgram`. Or `@solana/kit` (web3.js v2) for new builds.
- Testing: `solana-bankrun` (v1) or `litesvm` (v2), in-process, no faucet. See [testing.md](testing.md).

## Operating procedure
1. Decide legacy or v0. Use v0 when you need an ALT, or want compute-budget and priority-fee instructions in a clean format.
2. For an ALT: create with a recent slot, extend with the addresses, then use it only after a slot passes.
3. Compute budget: `setComputeUnitLimit` sized to the work, `setComputeUnitPrice` for priority. Do not over- or under-size the limit.
4. Build the v0 message with `compileToV0Message([...lookupTableAccounts])`, wrap in a `VersionedTransaction`, sign, send.
5. Verify by reading state back and asserting it in a test.

## Progressive disclosure
- [recipes.md](recipes.md) - tested code: create/extend/use a lookup table, build a v0 transaction, compute budget + priority fee, deactivate and close.
- [concepts.md](concepts.md) - v0 vs legacy, how ALTs work, the account-limit math, the compute budget.
- [testing.md](testing.md) - in-process testing with bankrun/litesvm, and the one lifecycle step a VM cannot model.
- [resources.md](resources.md) - docs and source.

## Task routing
| User asks about... | Read |
|---|---|
| Transaction too big / too many accounts | recipes.md (ALT + v0) |
| Create / extend / use a lookup table | recipes.md |
| Priority fee / compute-unit limit | recipes.md (compute budget) |
| Close a table / reclaim rent | recipes.md (lifecycle) |
| v0 vs legacy / how ALTs work | concepts.md |
| How to test this | testing.md |

## Commands
| Command | Purpose |
|---|---|
| /build-v0-tx | Build a v0 transaction, optionally with a lookup table and compute budget |
| /manage-alt | Create, extend, deactivate, or close a lookup table |

## Agents
| Agent | Purpose |
|---|---|
| tx-engineer | Implement and test versioned transactions, ALTs, and compute budget |
