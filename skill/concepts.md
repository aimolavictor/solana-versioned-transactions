# Concepts

## Legacy vs v0 transactions
A legacy transaction lists every account it touches inline. That list is bounded by the 1232-byte transaction size, so you hit a ceiling around 30 to 35 accounts depending on instructions and signatures. A v0 (versioned) transaction can also pull addresses from Address Lookup Tables, referencing each by a one-byte index instead of a full 32-byte key. Same size limit, far more accounts.

Use v0 when you need lookup tables, or as the modern default. Legacy still works for small transactions.

## How Address Lookup Tables work
An ALT is an on-chain account owned by the Address Lookup Table program that stores a list of addresses. You:
1. create it, tied to a recent slot which also derives its address,
2. extend it with addresses (up to 256, across as many extends as you like),
3. reference it in a v0 transaction, which resolves the accounts by index.

Two timing rules trip people up:
- The recent slot at creation must be present in the SlotHashes sysvar. Use a current or just-past slot.
- The table is usable only after a slot passes following the extend, so the addresses are settled before a transaction relies on them.

Lifecycle: the authority can deactivate a table, and close it after a roughly 513-slot cooldown to reclaim the rent. The cooldown protects transactions that referenced the table just before it was deactivated.

## The compute budget
Every transaction gets a default compute-unit budget. Heavy instructions can exceed it, so you raise it with `setComputeUnitLimit`. You attach a priority fee with `setComputeUnitPrice` (micro-lamports per compute unit), which is what gets your transaction picked up faster when the network is busy.

Set the limit close to actual usage. Too low fails the transaction. Too high inflates the priority fee, which is computed as `limit * price`. A common practice is to simulate the transaction first to learn the units it consumes, then set the limit a little above that.
