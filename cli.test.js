// cli.test.js — CLI contract tests (Task 2 / ING-02 edge): the transport shim blocks ALL
// fetches, so these tests prove the hardening without opening a single socket.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const BLOCK_FETCH =
  'data:text/javascript,' +
  encodeURIComponent(
    "globalThis.fetch = async () => { throw new Error('connect ECONNREFUSED 127.0.0.1:11434'); };"
  );

const CONTRACT_ERROR =
  "ERROR: Ollama unavailable at http://127.0.0.1:11434 — start it with 'ollama serve'";
const USAGE = 'Usage: node cli.js ask <document> "<question>"';

function runCli(args, { blockFetch = false } = {}) {
  const argv = blockFetch ? ['--import', BLOCK_FETCH, 'cli.js', ...args] : ['cli.js', ...args];
  return spawnSync(process.execPath, argv, { encoding: 'utf8' });
}

test('transport failure prints only the ERROR contract line, exits 1, no stack trace', () => {
  const r = runCli(['ask', 'fixtures/rental.txt', 'what is the notice period?'], {
    blockFetch: true,
  });
  assert.equal(r.status, 1);
  assert.equal(r.stdout, CONTRACT_ERROR + '\n');
  assert.equal(r.stderr, ''); // never a stack trace on any stream
});

test('missing or empty question prints the usage line and exits 1', () => {
  const empty = runCli(['ask', 'fixtures/rental.txt', '']);
  assert.equal(empty.status, 1);
  assert.equal(empty.stdout, USAGE + '\n');

  const missing = runCli(['ask']);
  assert.equal(missing.status, 1);
  assert.equal(missing.stdout, USAGE + '\n');
});
