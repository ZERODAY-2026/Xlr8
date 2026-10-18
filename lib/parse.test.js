// lib/parse.test.js — page-aware extraction smoke: a TXT document is one page of text.
// node --test lib/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// RED shim: while lib/parse.js does not exist this yields empty behavior so the
// planned assertions fail cleanly; once the module exists the catch never runs.
const load = () => import('./parse.js').catch(() => ({ parseFile: async () => [] }));

test('parses fixtures/rental.txt as one page of non-empty text', async () => {
  const { parseFile } = await load();
  const fixture = fileURLToPath(new URL('../fixtures/rental.txt', import.meta.url));
  const pages = await parseFile(fixture);
  const [first] = pages;
  assert.ok(first, 'parseFile must return a page record');
  assert.equal(first.page, 1);
  assert.ok(first.text.trim().length > 0, 'page text must not be empty');
});
