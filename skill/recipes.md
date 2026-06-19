# Recipes

Copy-paste patterns. Each mirrors a passing test in [`examples/`](../examples). When you generate code, follow these shapes.

## Setup
```ts
import {
  Connection, Keypair, PublicKey, SystemProgram, TransactionMessage,
  VersionedTransaction, AddressLookupTableProgram, AddressLookupTableAccount,
  ComputeBudgetProgram, LAMPORTS_PER_SOL,
} from '@solana/web3.js';
```

## Recipe 1: create and extend a lookup table

`createLookupTable` needs a recent slot (it both derives the table address and is checked against SlotHashes). Extend adds addresses. (examples/01)

```ts
const slot = await connection.getSlot();
const [createIx, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
  authority: payer.publicKey,
  payer: payer.publicKey,
  recentSlot: slot,
});
// send a transaction containing createIx

const extendIx = AddressLookupTableProgram.extendLookupTable({
  payer: payer.publicKey,
  authority: payer.publicKey,
  lookupTable: lookupTableAddress,
  addresses: [addr1, addr2 /* up to 256 total, across multiple extends */],
});
// send a transaction containing extendIx
```

## Recipe 2: build a v0 transaction that uses the table

A table is only usable a slot after the extend lands. Fetch it, then compile a v0 message against it. (examples/01)

```ts
const lookupTableAccount = (await connection.getAddressLookupTable(lookupTableAddress)).value;

const message = new TransactionMessage({
  payerKey: payer.publicKey,
  recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
  instructions: [/* instructions that reference addresses in the table */],
}).compileToV0Message([lookupTableAccount!]);

const tx = new VersionedTransaction(message);
tx.sign([payer]);
await connection.sendTransaction(tx);
```

`message.addressTableLookups` is non-empty when an instruction account was resolved through the table. That is how you confirm the table is actually being used and not silently ignored.

## Recipe 3: compute-unit limit and priority fee

Size the limit to the work, and add a priority fee with the price instruction. (examples/02)

```ts
const ixs = [
  ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }), // fit the work
  ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }), // priority fee
  // ... your instructions
];
```

Two traps the test pins down:
- A limit too low to cover the instructions fails the whole transaction with a compute-budget error.
- Transferring under the rent-exempt minimum (about 890,880 lamports for a 0-byte account) to a brand-new account fails with "insufficient funds for rent". Send a rent-exempt amount.

The priority fee you pay is `limit * price`, so an oversized limit also inflates the fee. Set the limit close to actual usage.

## Recipe 4: deactivate and close a table (reclaim rent)

You cannot close an active table. Deactivate, wait the cooldown, then close. (examples/03 tests the first half; the cooldown needs a live cluster, see testing.md)

```ts
// 1) deactivate (only the authority can)
const deactivateIx = AddressLookupTableProgram.deactivateLookupTable({
  lookupTable: lookupTableAddress,
  authority: payer.publicKey,
});

// 2) after ~513 slots, close and return the rent to a recipient
const closeIx = AddressLookupTableProgram.closeLookupTable({
  lookupTable: lookupTableAddress,
  authority: payer.publicKey,
  recipient: payer.publicKey,
});
```

Closing before the cooldown is rejected. The cooldown exists so transactions that referenced the table just before deactivation do not break.
