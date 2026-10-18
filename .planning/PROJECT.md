# LegalTriage (PS2) — Private Legal Document Triage Agent

## What This Is

An offline, on-device legal-document explainer built for ZeroDay OSS Hacktoberfest 2026, problem statement PS2. A non-lawyer uploads a rental agreement, employment contract, legal notice or service agreement (PDF or TXT); the tool explains clauses in plain language with verbatim cited passages, keeps what the document *states* apart from what it *implies*, flags what the document does not answer, and declines to give legal verdicts. Every byte of document content stays on the machine. The immediate users are the hackathon judges, scoring against the published PS2 rubric before 20:30 IST on 18 October 2026.

## Core Value

Every claim in every answer maps to a verbatim quote from the uploaded document that a judge can check — and when the document is silent, the tool says so instead of guessing. This drives every tradeoff: rubric criteria 2 (grounding), 3 (uncertainty/refusal) and 4 (privacy) carry a **safety cap at 40/100** if any lands in the Poor band, so polish is worthless until those three are proven.

## Requirements

### Validated

(Not applicable — greenfield build, nothing shipped yet. The stack itself is pre-validated: `gemma3n:e2b` was pulled, loaded and answered on this machine at 11:00.)

### Active

Mapped 1:1 to the guide's mandatory features L1–L10:

- [ ] **L1** Local ingestion of PDF and plain text
- [ ] **L2** On-device extraction and interpretation of document contents
- [ ] **L3** Plain-language summaries and explanations of important clauses
- [ ] **L4** Identification of obligations, rights, deadlines, penalties, termination conditions and concerns where present
- [ ] **L5** Responses supported by identifiable passages from the source document (verbatim, verified)
- [ ] **L6** Clear distinction between explicit statements and possible interpretations or concerns (three-tier evidence schema)
- [ ] **L7** Recognition of ambiguity, insufficient evidence and jurisdiction-dependent issues
- [ ] **L8** Refusal or limitation of unsupported conclusions, recommending a qualified legal professional when needed
- [ ] **L9** Demonstrable privacy: private contents do not leave the device during processing, proven by a reproducible connection-monitoring test
- [ ] **L10** Meaningful Gemma use (Gemma 3n E2B) and a reproducible open-source implementation with documented model acquisition

Plus the submission deliverables S1–S10 (public repo + licence, README, pinned dependencies, architecture explanation, dataset disclosure, Gemma usage writeup, demo, honest limitations, repro instructions, contribution statement).

### Out of Scope

- **OCR for scanned documents** — L1 requires *one* practical format; OCR is a large dependency for zero rubric gain in one day
- **Multilingual explanations** — {OPT} only, no points for PS2's scored criteria
- **Encryption at rest / deletion controls** — {OPT}; the privacy criterion is about *transmission*, not storage
- **Two-version comparison** — {OPT} stretch item, only if everything else is green
- **Any cloud service, hosted model API, cloud OCR or remote embeddings** — forbidden by the track; no exception is worth the risk
- **Legal validity verdicts, enforceability opinions, "should I sign?"** — presenting output as legal advice is explicitly penalised; this is a hard product boundary, not a missing feature
- **CUAD as evidence for consumer documents** — CUAD is commercial contracts; the guide warns against presenting its results as proof for rental or employment documents
- **Snowflake / any cloud data platform** — the guide says do not build PS2 around one
- **Vector database** — one document at a time; a JSON file plus cosine similarity is the whole retrieval layer

## Context

**The competition.** ZeroDay OSS Hacktoberfest 2026 (IIIT Dharwad), 1-day build, team of 3, submission deadline 20:30 IST on 18 October 2026. Final score = 0.70 × PS2 track score + 0.30 × common rubric (each /100). Pass/fail gates G1–G5 come first and cannot be offset by polish: public repo with open-source licence, reproducible demo without paid services, real system (not mock-ups), disclosed dataset licences, no secrets committed.

**Scoring structure.** PS2 rubric: accuracy 15, grounding/traceability 15, uncertainty/refusal/escalation 15, on-device privacy 15, Gemma integration 10, robustness 12, usability 8, reusability/docs 10. Common rubric: functional completeness 20, engineering quality 15, open-source quality 15, reproducibility 15, UX 10, testing 10, problem understanding 10, demo rationale 5. Bands: Poor 0–24%, Acceptable 25–59%, Good 60–84%, Outstanding 85–100%.

**How judges test.** Offline run with networking disabled or a blocking proxy; connection monitoring during processing (they look for the *absence* of connections); code and dependency review for remote calls and telemetry; confirmation that weights and inference are local; **checks on temporary files**. They ask questions the document does not answer, ask "is this enforceable?", feed vague clauses and prompt-injection text, and use **documents the team did not script**.

**Team and timeline.** P1 owns backend (parsing, chunking, retrieval, Ollama client, verifier, API). P2 owns privacy evidence, repo hygiene, docs, tests, submission pack. P3 owns the browser UI. Hard feature freeze at 17:30; nothing new starts after that. Working plan and timed checkpoints live in `tasks/plan.md` and `tasks/todo.md`.

**Machine.** Windows 11, ~15 GB RAM, CPU-only (no NVIDIA GPU), Node 24, git. Python is 3.7.9 (unusable for modern libraries) and Docker is absent — this is why the stack is Node rather than Python. The project folder sits inside OneDrive, which is why uploaded demo documents must be handled carefully (synced files are a transmission path that is easy to miss).

**Models, all local and verified.** `gemma3n:e2b` (7.8 GB, Gemma 3n class as the guide prefers) — pulled, loaded and answered on this machine on 18 October. `embeddinggemma` (621 MB) for local passage embeddings, which also counts as meaningful Gemma use. `gemma3:4b` (3.3 GB) held as an offline fallback reachable by one environment variable. Ollama updated 0.35.1 → 0.40.6, because the older version refused the 3n class.

**Nothing is built yet.** As of 11:00 on 18 October there is no `package.json`, no source code and no LICENSE — only this plan, the GSD planning setup and the codebase map. Roughly nine hours remain.

## Constraints

- **Timeline**: submission deadline 20:30 IST, 18 October 2026 — hard feature freeze at 17:30, fresh-clone run-through at 20:00 — because a demo that only works on the builder's machine fails gates G2 and G3
- **Tech stack**: Node 24 + Express, plain JS (no TypeScript build step), `pdfjs-dist` for page-aware PDF text — because page numbers are required for "page N" citations and Python 3.7.9 cannot host modern parsing libraries
- **Model**: Gemma 3n-class run through local Ollama — required technology for the track, and the only thing allowed to see document content
- **Privacy**: the process may open no socket other than `127.0.0.1:11434`; Ollama update checks disabled (`OLLAMA_NO_UPDATE_CHECKS=true`, `ollama serve` instead of the tray app) and documented as the one setup-time network call — because the guide requires any remaining network access to carry no content and be off or optional
- **Memory**: ~15 GB RAM shared with the browser during a live demo — because CPU inference plus a 7.8 GB model plus a browser is a real swap risk, retrieval is capped at top-k 6 chunks
- **Repo**: GitHub repository is assigned by the organizers later today and cannot be pushed to yet — because G1 requires a public repo by submission, local `git init` plus clean atomic commits now, push the moment the repo exists
- **Data licences**: only CC-licensed or self-authored documents may be committed, with sources and attributions disclosed — because G4 forbids committing private or non-redistributable data. India Code's terms were not verified and the site blocks automated access; Open India Law needs Hugging Face login and is ~54 GB, so neither is committed
- **Temp hygiene**: extracted text, chunks and embeddings live in the project directory and must not leak into system temp folders — because judges explicitly check temporary files

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PS2 track over PS1 | No Snowflake account, credits or timing risk; PS2 rewards the privacy/grounding work a 3-person team can finish in a day | ✓ Good |
| Node 24 + Express over Python | Python on this box is 3.7.9 and Docker is absent; Node 24 is installed and capable | ✓ Good |
| `pdfjs-dist` for parsing | Gives per-page text, which a whole-document string cannot; citations must say "page N" | ✓ Good |
| No vector DB — JSON + cosine | One document at a time; a database is a dependency, not a feature | ✓ Good |
| Citation verifier as a hard gate | Every model-returned quote must occur verbatim (whitespace-normalised) in a stored chunk, else the claim is dropped and reported unverifiable — this is what defeats the fabrication gate | ✓ Good |
| Three-tier evidence schema | `stated` / `interpretation` / `not_in_document` plus an `escalate` flag, encoding rubric criteria 3 and 6 in the data model rather than trusting the prompt | ✓ Good |
| `gemma3n:e2b` as primary, `gemma3:4b` fallback | Both are accepted Gemma variants; e2b fits 15 GB RAM with room for the browser, e4b's 9.8 GB weights risk swapping mid-demo | ✓ Good |
| `embeddinggemma` for local embeddings | Keeps embeddings on-device and counts toward meaningful Gemma use | ✓ Good |
| Synthetic consumer fixtures + CUAD | CUAD is CC BY 4.0 but contains only commercial contracts; rental and employment demos need clearly-labelled synthetic documents, with honest disclosure | — Pending |
| Privacy proven by construction, not assertion | The app holds no outbound socket except localhost; a PowerShell script records every non-loopback connection of `node.exe`/`ollama.exe` during a full run under a firewall rule | — Pending |
| Plain single-page UI, no React build | A build step adds failure modes to a demo that must run from a fresh clone | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-18 after initialization*
