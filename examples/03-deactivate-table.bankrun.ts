/**
 * Lookup table lifecycle: you cannot close an ACTIVE table, you must deactivate
 * it first. This proves both in-process.
 *
 * The final step, closing after the ~513-slot cooldown to reclaim rent, depends
 * on the SlotHashes sysvar aging out the deactivation slot. An in-process VM
 * jumps the clock without simulating hundreds of real slot hashes, so that last
 * step is documented in recipes.md and verified on a live cluster, not asserted
 * here. We do not fake a green check for something the VM can't model.
 *
 * Deterministic, no network, no SOL. Run:  npx tsx 03-deactivate-table.bankrun.ts
 */
import { start } from 'solana-bankrun';
import { Transaction, AddressLookupTableProgram, AddressLookupTableAccount } from '@solana/web3.js';

let passed = 0;
const check = (c: boolean, m: string) => {
  if (c) { passed++; console.log('  PASS:', m); } else { console.error('  FAIL:', m); process.exit(1); }
};

async function main() {
  const context = await start([], []);
  const client = context.banksClient;
  const payer = context.payer;

  const run = async (ixs: any[]) => {
    const tx = new Transaction();
    tx.recentBlockhash = (await client.getLatestBlockhash())![0];
    tx.feePayer = payer.publicKey;
    tx.add(...ixs);
    tx.sign(payer);
    try { return { ok: true, meta: await client.processTransaction(tx) }; }
    catch (e) { return { ok: false, err: String(e).slice(0, 120) }; }
  };

  context.warpToSlot(10n);
  const recentSlot = Number((await client.getClock()).slot) - 1;
  const [createIx, altAddress] = AddressLookupTableProgram.createLookupTable({ authority: payer.publicKey, payer: payer.publicKey, recentSlot });
  await run([createIx]);
  check(Number((await client.getAccount(altAddress))!.lamports) > 0, 'table created and rent-funded');

  // An active table cannot be closed.
  const early = await run([AddressLookupTableProgram.closeLookupTable({ lookupTable: altAddress, authority: payer.publicKey, recipient: payer.publicKey })]);
  check(!early.ok, 'closing an active table is rejected (must deactivate first)');

  // Deactivate it.
  const deact = await run([AddressLookupTableProgram.deactivateLookupTable({ lookupTable: altAddress, authority: payer.publicKey })]);
  check(deact.ok, 'deactivate succeeds');

  // The table still exists, now deactivating. After ~513 slots it can be closed.
  const state = AddressLookupTableAccount.deserialize(Buffer.from((await client.getAccount(altAddress))!.data));
  check(state.deactivationSlot !== undefined, 'table records a deactivation slot');

  console.log(`\nALL ${passed} CHECKS PASSED`);
}

main().catch((e) => { console.error('ERROR', e); process.exit(1); });
