// lib/chunk.test.js — within-page paragraph chunking: a chunk never spans a page.
// node --test lib/
import { test } from 'node:test';
import assert from 'node:assert/strict';

// RED shim: while lib/chunk.js does not exist this yields undefined behavior so the
// planned assertions fail cleanly; once the module exists the catch never runs.
const load = () => import('./chunk.js').catch(() => ({ chunk: () => undefined }));

test('splits a two-paragraph page into two chunks carrying that page', async () => {
  const { chunk } = await load();
  assert.deepEqual(chunk([{ page: 1, text: 'First paragraph.\n\nSecond paragraph.' }]), [
    { id: 0, page: 1, text: 'First paragraph.' },
    { id: 1, page: 1, text: 'Second paragraph.' },
  ]);
});

test('keeps multi-page input page-pure with ids ascending by page then order', async () => {
  const { chunk } = await load();
  assert.deepEqual(
    chunk([
      { page: 1, text: 'Page one A.\n\nPage one B.' },
      { page: 2, text: 'Page two only.' },
    ]),
    [
      { id: 0, page: 1, text: 'Page one A.' },
      { id: 1, page: 1, text: 'Page one B.' },
      { id: 2, page: 2, text: 'Page two only.' },
    ],
  );
});

test('yields zero chunks for empty or whitespace-only page text', async () => {
  const { chunk } = await load();
  assert.deepEqual(chunk([]), []);
  assert.deepEqual(chunk([{ page: 1, text: '   \n\t  ' }]), []);
});
