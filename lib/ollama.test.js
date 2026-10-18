// lib/ollama.test.js — proves the T-01-05 failure sequence without touching the network:
// invalid model JSON → one retry on the same model → gemma3:4b fallback → single error;
// transport failures collapse onto the docs/api.md ERROR contract line.
// global.fetch is stubbed here only (a socket would violate this suite's no-network rule).
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { chat, OLLAMA_UNAVAILABLE_MESSAGE } from './ollama.js';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function reply(content) {
  return { ok: true, json: async () => ({ message: { content } }) };
}

test('retries once with the same model, then falls back to gemma3:4b, then errors', async () => {
  const calls = [];
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body).model);
    return reply('{"quote":  // deliberately broken JSON from the model');
  };
  await assert.rejects(chat({ system: 's', user: 'u' }), /unusable JSON/);
  assert.deepEqual(calls, ['gemma3n:e2b', 'gemma3n:e2b', 'gemma3:4b']);
});

test('valid-shaped reply passes through without fallback', async () => {
  const calls = [];
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body).model);
    return reply(JSON.stringify({ quote: 'q', plain: 'p' }));
  };
  const out = await chat({ system: 's', user: 'u' });
  assert.deepEqual(out, { quote: 'q', plain: 'p' });
  assert.deepEqual(calls, ['gemma3n:e2b']);
});

test('missing quote/plain fields are treated as unusable, not passed on', async () => {
  globalThis.fetch = async () => reply(JSON.stringify({ quote: 'q' }));
  await assert.rejects(chat({ system: 's', user: 'u' }), /unusable JSON/);
});

test('accepts a multi-claim reply whose claims each carry a quote', async () => {
  const calls = [];
  globalThis.fetch = async (_url, opts) => {
    calls.push(JSON.parse(opts.body).model);
    return reply(
      JSON.stringify({ plain: 'p', claims: [{ quote: 'q1', plain: 'one' }, { quote: 'q2' }] })
    );
  };
  const out = await chat({ system: 's', user: 'u' });
  assert.deepEqual(out, { plain: 'p', claims: [{ quote: 'q1', plain: 'one' }, { quote: 'q2' }] });
  assert.deepEqual(calls, ['gemma3n:e2b']);
});

test('transport failure surfaces the docs/api.md ERROR contract line', async () => {
  globalThis.fetch = async () => {
    throw new Error('fetch failed');
  };
  await assert.rejects(
    chat({ system: 's', user: 'u' }),
    (err) => err.message === OLLAMA_UNAVAILABLE_MESSAGE && err.transport === true
  );
});
