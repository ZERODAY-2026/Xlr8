#!/usr/bin/env node
// cli.js — Checkpoint-1 entry point: `node cli.js ask <document> "<question>"`.
// The output strings are the docs/api.md §4 contract, verbatim. console.* only; an
// unexpected failure prints one ERROR line and exits 1 — never a stack trace.
import { askFile, USAGE_LINE } from './lib/pipeline.js';

const [, , command, document, ...rest] = process.argv;
const question = rest.join(' ').trim();

// ING-02 edge: a missing or empty question is a usage error, not a crash.
if (command !== 'ask' || !document || question === '') {
  console.log(USAGE_LINE);
  process.exit(1);
}

try {
  const result = await askFile(document, question);
  if (result.unverifiable) {
    // Honest domain outcome (exit 0): the gate rejected the quote, so nothing of it
    // is printed — the quote must never reach stdout unless verify() approved it.
    console.log(`UNVERIFIABLE: ${result.reason}`);
  } else {
    console.log(`ANSWER: ${result.answer}`);
    console.log(`QUOTE: ${result.quote}`);
    console.log(`PAGE: ${result.page}`);
  }
} catch (err) {
  if (err && err.usage) console.log(USAGE_LINE);
  else console.log(`ERROR: ${err && err.message ? err.message : String(err)}`);
  process.exit(1);
}
