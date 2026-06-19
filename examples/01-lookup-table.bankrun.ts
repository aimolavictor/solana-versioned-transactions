/**
 * Address Lookup Tables + a v0 (versioned) transaction, end to end.
 *
 * Proves the two things people get wrong:
 *   1. createLookupTable needs a RECENT slot that exists in SlotHashes.
 *   2. a table can't be used until a slot passes after the extend (warm-up).
 * Then it builds a v0 transaction that resolves an address THROUGH the table.
 *
 * Deterministic, no network, no SOL. Run:  npx tsx 01-lookup-table.bankrun.ts
 */
import { start } from 'solana-bankrun';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  AddressLookupTableProgram,
  AddressLookupTableAccount,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

let passed = 0;
const check = (c: boolean, m: string) => {
  if (c) { passed++; console.log('  PASS:', m); } else { console.error('  FAIL:', m); process.exit(1); }
};

async function main() {
  const context = await start([], []);
  const client = context.banksClient;
  const payer = context.payer;

  const sendLegacy = async (ixs: any[], signers: Keypair[]) => {
    const tx = new Transaction();
    tx.recentBlockhash = (await client.getLatestBlockhash())![0];
    tx.feePayer = payer.publicKey;
    tx.add(...ixs);
    tx.sign(...signers);
    return client.processTransaction(tx);
  };

  // Advance a few slots so SlotHashes is populated and we have a valid recent slot.
  context.warpToSlot(10n);
  let recentSlot = Number((await client.getClock()).slot) - 1;
  console.log('current slot:', Number((await client.getClock()).slot), 'using recentSlot:', recentSlot);

  // 1) Create the lookup table.
  const [createIx, altAddress] = AddressLookupTableProgram.createLookupTable({
    authority: payer.publicKey,
    payer: payer.publicKey,
    recentSlot,
  });
  await sendLegacy([createIx], [payer]);
  check(!!(await client.getAccount(altAddress)), 'lookup table account created');

  // 2) Extend it with addresses, including the recipient we will transfer to.
  const recipient = Keypair.generate().publicKey;
  const addresses = [recipient, SystemProgram.programId, Keypair.generate().publicKey, Keypair.generate().publicKey];
  const extendIx = AddressLookupTableProgram.extendLookupTable({
    payer: payer.publicKey,
    authority: payer.publicKey,
    lookupTable: altAddress,
    addresses,
  });
  await sendLegacy([extendIx], [payer]);

  // 3) Warm-up: a table is only usable a slot AFTER the extend landed.
  context.warpToSlot(20n);

  // Read the table back and build the AddressLookupTableAccount the compiler needs.
  const altRaw = await client.getAccount(altAddress);
  const alt = new AddressLookupTableAccount({
    key: altAddress,
    state: AddressLookupTableAccount.deserialize(Buffer.from(altRaw!.data)),
  });
  check(alt.state.addresses.length === addresses.length, `table holds ${addresses.length} addresses`);
  check(alt.state.addresses[0].equals(recipient), 'recipient is in the table at index 0');

  // 4) Build a v0 transaction that transfers to the recipient, resolved via the table.
  const amount = LAMPORTS_PER_SOL; // 1 SOL
  const transferIx = SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: recipient, lamports: amount });
  const msg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: (await client.getLatestBlockhash())![0],
    instructions: [transferIx],
  }).compileToV0Message([alt]);

  check(msg.addressTableLookups.length === 1, 'v0 message uses the lookup table');

  const vtx = new VersionedTransaction(msg);
  vtx.sign([payer]);
  await client.processTransaction(vtx);

  const recvAcc = await client.getBalance(recipient);
  console.log('recipient balance:', Number(recvAcc) / LAMPORTS_PER_SOL, 'SOL');
  check(Number(recvAcc) === amount, 'transfer through the lookup table landed');

  console.log(`\nALL ${passed} CHECKS PASSED`);
}

main().catch((e) => { console.error('ERROR', e); process.exit(1); });
