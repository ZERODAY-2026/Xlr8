// public.test.js — TDD contract for the browser upload shell (01-UI-SPEC) plus the
// ask slice (quick task browser-ask-ui — D-04 CLI-only lock intentionally lifted).
// Reads the served assets statically; the live-server checks (GET / serves the shell)
// run in the plan's <verify> sampler. A missing file reads as '' so every assertion
// fails on the planned copy/behavior rather than a module-load error.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (f) => (fs.existsSync(`public/${f}`) ? fs.readFileSync(`public/${f}`, 'utf8') : '');

test('serves an upload shell with the verbatim CTA, empty state and aria labels', () => {
  const html = read('index.html');
  assert.ok(html.includes('Upload agreement'), 'CTA copy "Upload agreement" present');
  assert.ok(html.includes('aria-label="Upload agreement"'), 'CTA aria-label present');
  assert.ok(html.includes('No document yet'), 'empty-state heading verbatim');
  assert.ok(html.includes('Files never leave this machine.'), 'empty-state body verbatim');
  assert.ok(
    html.includes('Processed entirely on this machine. No document content is sent over the network.'),
    'privacy reassurance verbatim',
  );
  assert.ok(html.includes('aria-label="Remove document"'), 'remove-document aria-label present');
});

test('app.js drives the upload flow against the local API', () => {
  const js = read('app.js');
  assert.ok(js.includes('/api/upload'), 'fetches POST /api/upload');
  assert.ok(js.includes('/api/doc/'), 'fetches GET /api/doc/{docId}');
  assert.ok(js.includes('Processing…'), 'CTA relabelled "Processing…" verbatim');
  assert.ok(js.includes('Extracting pages → chunking → embedding locally'), 'loading copy verbatim');
  assert.ok(js.includes('p. '), 'page chip renders "p. {page}"');
});

test('no external http(s) references in public/ (privacy loopback-only gate)', () => {
  for (const f of ['index.html', 'app.js', 'styles.css']) {
    const t = read(f);
    for (const m of t.matchAll(/https?:\/\/([^\s/"']+)/g)) {
      assert.ok(
        m[1] === '127.0.0.1' || m[1] === 'localhost',
        `${f}: non-loopback reference ${m[0]}`,
      );
    }
  }
});

// D-04 scope lock intentionally lifted by quick task browser-ask-ui (PLAN.md task 2):
// the phase-1 CLI-only pin below is flipped — Q&A in public/ is now in scope.
test('app.js drives the ask flow against the local API', () => {
  const js = read('app.js');
  assert.ok(js.includes('/api/ask'), 'fetches POST /api/ask');
  assert.ok(js.includes('Thinking locally…'), 'ask loading status verbatim');
  assert.ok(js.includes('question'), 'submits the question field');
});

test('index.html carries the ask form and answer region', () => {
  const html = read('index.html');
  assert.ok(html.includes('id="ask-form"'), 'ask form present');
  assert.ok(html.includes('for="question"'), 'question input labelled');
  assert.ok(html.includes('id="question"'), 'question input present');
  assert.ok(html.includes('id="ask-btn"'), 'Ask button present');
  assert.ok(html.includes('id="answer"'), 'answer region present');
  assert.ok(html.includes('<blockquote'), 'quote renders in a blockquote');
  assert.ok(html.includes('id="answer-page"'), 'page chip slot present');
});

test('styles.css carries the UI-SPEC design tokens', () => {
  const css = read('styles.css');
  for (const token of ['#FAF8F4', '#FFFFFF', '#E4DED2', '#F1EDE5', '#1C2430', '#5A6272', '#B42318', '#295499']) {
    assert.ok(css.includes(token), `token ${token} present`);
  }
  assert.ok(css.includes('system-ui'), 'system font stack');
  assert.ok(css.includes('calc(100vh'), 'chunk list max-height per E5 overflow row');
});
