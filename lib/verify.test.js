// lib/verify.test.js — the GRD-01 citation gate: normalise-then-substring, never relaxed.
// node --test lib/
import { test } from 'node:test';
import assert from 'node:assert/strict';

// RED shim: while lib/verify.js does not exist this yields undefined behavior so the
// planned assertions fail cleanly; once the module exists the catch never runs.
const load = () => import('./verify.js').catch(() => ({ verify: () => undefined }));

const chunks = [
  { id: 0, page: 1, text: "Either party may end this agreement by giving the other party 60 days' written notice." },
  { id: 1, page: 2, text: 'The Tenant shall pay a monthly rent of Rs. 28,000 on the 5th day.' },
];

test('verifies a verbatim quote and cites the chunk page', async () => {
  const { verify } = await load();
  assert.deepEqual(verify("60 days' written notice", chunks), { verifiable: true, page: 1 });
});

test('rejects a paraphrased quote as unverifiable', async () => {
  const { verify } = await load();
  assert.deepEqual(verify('the agreement can be ended by giving two months notice', chunks), {
    verifiable: false,
    reason: 'quote not found in source',
  });
});

test('rejects an invented quote as unverifiable', async () => {
  const { verify } = await load();
  assert.deepEqual(verify('the tenant must repaint the walls every single week', chunks), {
    verifiable: false,
    reason: 'quote not found in source',
  });
});

test('rejects an empty or whitespace-only quote before any substring test', async () => {
  const { verify } = await load();
  assert.deepEqual(verify('', chunks), { verifiable: false, reason: 'empty quote' });
  assert.deepEqual(verify('   \n\t  ', chunks), { verifiable: false, reason: 'empty quote' });
});

test('verifies a quote with ligature and en-dash variants through normalisation', async () => {
  const { verify } = await load();
  const lig = [{ id: 0, page: 3, text: 'The office is a first-rate facility - open 9 to 5.' }];
  assert.deepEqual(verify('a \uFB01rst-rate facility \u2013 open 9 to 5', lig), { verifiable: true, page: 3 });
});

test('cites the earliest chunk page when a quote occurs in several chunks', async () => {
  const { verify } = await load();
  const multi = [
    { id: 0, page: 1, text: 'Notice: 60 days.' },
    { id: 1, page: 2, text: 'Notice: 60 days.' },
  ];
  assert.deepEqual(verify('Notice: 60 days.', multi), { verifiable: true, page: 1 });
});

test('verifies a quote exactly equal to a whole chunk text', async () => {
  const { verify } = await load();
  assert.deepEqual(verify(chunks[1].text, chunks), { verifiable: true, page: 2 });
});
