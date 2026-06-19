/**
 * Compute budget: set a compute-unit limit and a priority fee on a transaction.
 *
 * Proves the limit is real (a too-low limit fails the transfer) and that a
 * priority fee plus a sufficient limit goes through, with the units it actually
 * consumed read back from the result.
 *
 * Deterministic, no network, no SOL. Run:  npx tsx 02-compute-budget.bankrun.ts
 */
import { start } from 'solana-bankrun';
import { Keypair, SystemProgram, Transaction, ComputeBudgetProgram } from '@solana/web3.js';

let passed = 0;
const check = (c: boolean, m: string) => {
  if (c) { passed++; console.log('  PASS:', m); } else { console.error('  FAIL:', m); process.exit(1); }
};

async function main() {
  const context = await start([], []);
  const client = context.banksClient;
  const payer = context.payer;
  const recipient = Keypair.generate().publicKey;

  const run = async (ixs: any[]) => {
    const tx = new Transaction();
    tx.recentBlockhash = (await client.getLatestBlockhash())![0];
    tx.feePayer = payer.publicKey;
    tx.add(...ixs);
    tx.sign(payer);
    try {
      const meta = await client.processTransaction(tx);
      return { ok: true, meta };
    } catch (e) {
      return { ok: false, err: String(e).slice(0, 120) };
    }
  };

  // 1_000_000 lamports is above the rent-exempt minimum for a new account.
  // (A smaller amount like 1000 would fail with "insufficient funds for rent".)
  const transfer = SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: recipient, lamports: 1_000_000 });

  // 1) A 10-unit limit cannot cover a transfer -> it fails.
  const low = await run([ComputeBudgetProgram.setComputeUnitLimit({ units: 10 }), transfer]);
  console.log('low-limit result:', low.ok ? 'unexpectedly ok' : low.err);
  check(!low.ok, 'a 10 compute-unit limit makes the transfer fail');

  // 2) A priority fee + a sufficient limit goes through.
  const good = await run([
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 }),
    ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
    transfer,
  ]);
  check(good.ok, 'priority fee + sufficient limit lets the transfer through');
  console.log('compute units consumed:', good.meta ? String(good.meta.computeUnitsConsumed) : 'n/a');
  check(Number(await client.getBalance(recipient)) === 1_000_000, 'recipient received the transfer');

  console.log(`\nALL ${passed} CHECKS PASSED`);
}

main().catch((e) => { console.error('ERROR', e); process.exit(1); });
