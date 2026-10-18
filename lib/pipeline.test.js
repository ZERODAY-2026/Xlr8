// lib/pipeline.test.js — the per-claim verify gate: a model reply (multi-claim or the
// legacy single {quote, plain} pair) survives only for the claims whose quote
// lib/verify.js approves. Pure — fixture chunks in, no socket, no ./data writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifiedClaims } from './pipeline.js';

const chunks = [
  { id: 0, page: 1, text: 'The tenant shall pay rent on the first day of each month.' },
  { id: 1, page: 2, text: 'Either party may terminate with thirty days written notice.' },
];

test('keeps only the verified claims, in model order; a legacy reply yields one claim', () => {
  // Multi-claim: the invented quote is dropped, the two real ones keep model order/page.
  const multi = {
    plain: 'Rent and notice terms.',
    claims: [
      { quote: 'thirty days written notice', plain: 'Notice period is 30 days.' },
      { quote: 'the landlord shall paint the walls', plain: 'Invented.' },
      { quote: 'pay rent on the first day', plain: 'Rent is due monthly.' },
    ],
  };
  assert.deepEqual(verifiedClaims(multi, chunks), [
    { quote: 'thirty days written notice', page: 2, plain: 'Notice period is 30 days.' },
    { quote: 'pay rent on the first day', page: 1, plain: 'Rent is due monthly.' },
  ]);

  // Legacy single pair still yields exactly one verified claim.
  const legacy = { quote: 'pay rent on the first day', plain: 'Rent is due monthly.' };
  assert.deepEqual(verifiedClaims(legacy, chunks), [
    { quote: 'pay rent on the first day', page: 1, plain: 'Rent is due monthly.' },
  ]);
});
