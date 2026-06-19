---
description: "Create, extend, deactivate, or close an Address Lookup Table"
---

Manage a lookup table's lifecycle. Follow [../skill/recipes.md](../skill/recipes.md).

## Create and extend
1. `recentSlot = await connection.getSlot()`.
2. `[createIx, address] = AddressLookupTableProgram.createLookupTable({ authority, payer, recentSlot })`. Send it.
3. `extendLookupTable({ payer, authority, lookupTable: address, addresses })`. Send it. Up to 256 addresses total, across multiple extends.
4. Wait one slot before using the table in a v0 transaction.

## Deactivate and close
1. `deactivateLookupTable({ lookupTable, authority })`.
2. After ~513 slots, `closeLookupTable({ lookupTable, authority, recipient })` to reclaim the rent.
3. Closing an active or still-cooling table is rejected.

## Notes
- Only the authority can extend, deactivate, or close.
- The cooldown protects in-flight transactions that referenced the table.
