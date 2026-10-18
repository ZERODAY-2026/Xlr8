// public.test.js — TDD contract for the browser upload shell (01-UI-SPEC, D-04 scope lock).
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

test('no external http(s) references and no Q&A UI in public/ (D-04 scope lock)', () => {
  for (const f of ['index.html', 'app.js', 'styles.css']) {
    const t = read(f);
    for (const m of t.matchAll(/https?:\/\/([^\s/"']+)/g)) {
      assert.ok(
        m[1] === '127.0.0.1' || m[1] === 'localhost',
        `${f}: non-loopback reference ${m[0]}`,
      );
    }
  }
  const html = read('index.html') + read('app.js');
  assert.ok(!html.includes('/api/ask'), 'no Q&A control in public/ (D-04)');
});

test('styles.css carries the UI-SPEC design tokens', () => {
  const css = read('styles.css');
  for (const token of ['#FAF8F4', '#FFFFFF', '#E4DED2', '#F1EDE5', '#1C2430', '#5A6272', '#B42318', '#295499']) {
    assert.ok(css.includes(token), `token ${token} present`);
  }
  assert.ok(css.includes('system-ui'), 'system font stack');
  assert.ok(css.includes('calc(100vh'), 'chunk list max-height per E5 overflow row');
});
