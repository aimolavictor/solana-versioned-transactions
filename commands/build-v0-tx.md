---
description: "Build a v0 (versioned) transaction, optionally with a lookup table and compute budget"
---

Build a versioned transaction. Follow [../skill/recipes.md](../skill/recipes.md).

## Steps
1. Gather the instructions. If the transaction references many accounts, set up an Address Lookup Table (see /manage-alt) and fetch its account with `connection.getAddressLookupTable(address)`.
2. Add compute budget if needed: `setComputeUnitLimit` sized to the work, `setComputeUnitPrice` for a priority fee.
3. Build the message: `new TransactionMessage({ payerKey, recentBlockhash, instructions }).compileToV0Message([lookupTableAccount])`.
4. Wrap in `VersionedTransaction`, sign with the array of signers, send.
5. Confirm the table is used: `message.addressTableLookups` should be non-empty if you expected a lookup.

## Checklist
- [ ] v0 chosen for the right reason (lookup table or modern default)
- [ ] table used only after a slot passed since the extend
- [ ] compute-unit limit sized to actual usage
- [ ] transfers to new accounts are rent-exempt
- [ ] verified in a bankrun/litesvm test
