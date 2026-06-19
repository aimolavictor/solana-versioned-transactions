# solana-versioned-transactions

Versioned (v0) transactions, Address Lookup Tables, and the compute budget, as a Claude Code skill. Build transactions that fit more accounts, attach priority fees, and manage lookup-table lifecycle. Backed by tested examples that run with no network and no SOL.

## Overview

A legacy Solana transaction caps at roughly 30 to 35 accounts and has no native fee priority. Versioned (v0) transactions plus Address Lookup Tables raise the account ceiling by storing addresses on-chain and referencing them by a one-byte index, and the compute budget program sets per-transaction limits and priority fees.

These features have sharp edges that break most first attempts: the recent-slot requirement when creating a table, the warm-up delay before a table can be used, the rent-exempt minimum on transfers, and the deactivation cooldown before a table can be closed. This skill encodes the patterns that work and ships runnable examples that prove them. When Claude generates a versioned transaction, it mirrors a tested example instead of inventing API.

## What's included

| File | What it covers |
|---|---|
| [skill/SKILL.md](skill/SKILL.md) | Entry point. When to use v0, the gotchas, task routing. |
| [skill/recipes.md](skill/recipes.md) | Tested code: create/extend/use a table, build a v0 tx, compute budget, deactivate and close. |
| [skill/concepts.md](skill/concepts.md) | v0 vs legacy, how lookup tables work, the compute budget. |
| [skill/testing.md](skill/testing.md) | In-process testing, and the one lifecycle step a VM cannot model. |
| [skill/resources.md](skill/resources.md) | Docs and source. |

## Tested, reproducibly

The examples in [`examples/`](examples) run as tests under [solana-bankrun](https://github.com/kevinheavey/solana-bankrun), in-process, with no validator, no airdrop, no faucet. They pass deterministically and run in CI.

```
cd examples
npm install
npm test
```

| Example | Proves |
|---|---|
| [`01-lookup-table.bankrun.ts`](examples/01-lookup-table.bankrun.ts) | Create and extend a table (handling the recent-slot and warm-up rules), then build a v0 transaction that resolves an address through it. |
| [`02-compute-budget.bankrun.ts`](examples/02-compute-budget.bankrun.ts) | A too-low compute-unit limit fails the transfer, a priority fee plus a sufficient limit passes, and the rent-exempt trap on transfers to new accounts. |
| [`03-deactivate-table.bankrun.ts`](examples/03-deactivate-table.bankrun.ts) | An active table cannot be closed, and deactivation works. |

The final step, closing a table after its ~513-slot cooldown, is verified on a live cluster, not faked in the suite, because an in-process VM cannot model hundreds of real slot hashes. The suite only asserts what it can actually prove. See [skill/testing.md](skill/testing.md).

## Installation

```bash
./install.sh         # standard, default location
./install-custom.sh  # custom, choose the location
```

## Default stack (June 2026)

| Layer | Choice |
|---|---|
| Client (classic) | `@solana/web3.js` 1.98.x |
| Client (new builds) | `@solana/kit` (web3.js v2) |
| Testing (v1) | `solana-bankrun` |
| Testing (v2) | `litesvm` |

All testing is in-process. No network, no faucet, no airdrop.

## Agents

| Agent | Model | Purpose |
|---|---|---|
| tx-engineer | sonnet | Implement and test versioned transactions, lookup tables, and compute budget. |

## Commands

| Command | Purpose |
|---|---|
| `/build-v0-tx` | Build a v0 transaction, optionally with a lookup table and compute budget. |
| `/manage-alt` | Create, extend, deactivate, or close a lookup table. |

## Usage examples

- "My transaction has too many accounts, set up a lookup table."
- "Add a priority fee and a compute-unit limit to this transaction."
- "Build a v0 transaction that swaps across three pools."
- "How do I close a lookup table and get the rent back?"

## Repository structure

```
solana-versioned-transactions/
├── skill/
│   ├── SKILL.md
│   ├── recipes.md
│   ├── concepts.md
│   ├── testing.md
│   └── resources.md
├── examples/
│   ├── 01-lookup-table.bankrun.ts
│   ├── 02-compute-budget.bankrun.ts
│   ├── 03-deactivate-table.bankrun.ts
│   ├── run-tests.sh
│   └── package.json
├── agents/
│   └── tx-engineer.md
├── commands/
│   ├── build-v0-tx.md
│   └── manage-alt.md
├── rules/
│   └── typescript.md
├── install.sh
├── install-custom.sh
├── CLAUDE.md
├── README.md
└── LICENSE
```

## License

MIT. See [LICENSE](LICENSE).

---

Contributed to the [Solana AI Kit](https://github.com/solanabr/solana-claude).
