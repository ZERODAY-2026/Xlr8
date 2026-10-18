# Requirements — LegalTriage (PS2)

v1 scope for the ZeroDay OSS Hacktoberfest 2026 submission, deadline 20:30 IST, 18 October 2026.
Derived from the participant guide's mandatory features L1–L10 and submission deliverables S1–S10.
Hard feature freeze at 17:30.

## v1 Requirements

### Ingestion

- [x] **ING-01**: User can upload a PDF or TXT legal document through the browser UI
- [x] **ING-02**: User can ask a question in plain English about the uploaded document
- [x] **ING-03**: Extraction is page-aware so every citation can name its page

### Understanding

- [ ] **UND-01**: User gets a plain-language explanation of important clauses, obligations, rights, deadlines, penalties and termination conditions
- [ ] **UND-02**: User sees a structured panel of extracted parties, dates, penalties and notice periods

### Grounding

- [x] **GRD-01**: Every claim shows a verbatim quote from the document, verified to exist in the source before display (hard gate, not a prompt request)
- [ ] **GRD-02**: Every claim shows its page number and highlights the source passage side-by-side
- [ ] **GRD-03**: When the document is silent on a question, the user is told so explicitly

### Uncertainty & Refusal

- [ ] **UNC-01**: Every answer is tagged `stated` / `interpretation` / `not_in_document`
- [ ] **UNC-02**: Verdict questions ("is this enforceable?") get a refusal plus specific escalation advice
- [ ] **UNC-03**: Ambiguous, incomplete or jurisdiction-dependent issues are flagged with an escalation banner
- [ ] **UNC-04**: A disclaimer states this is not legal advice and appears on every screen

### Privacy

- [x] **PRV-01**: The process opens no socket other than `127.0.0.1:11434` during document processing
- [ ] **PRV-02**: A reproducible script records connection-monitoring evidence to `evidence/privacy-report.md`
- [ ] **PRV-03**: No document content reaches temp folders, telemetry, logs or update checks
- [ ] **PRV-04**: Ollama update checks are disabled and documented as the one setup-time network call

### Model

- [x] **MDL-01**: Gemma 3n E2B runs locally via Ollama and does the document understanding
- [x] **MDL-02**: Local embeddings via `embeddinggemma` for passage retrieval
- [ ] **MDL-03**: Memory and speed reported (tokens/s, RSS, per-question latency)
- [ ] **MDL-04**: Model acquisition documented: weights, licence to accept, variant, quantization, runtime

### Robustness

- [ ] **ROB-01**: Malformed files, long documents and vague or conflicting wording fail gracefully
- [ ] **ROB-02**: Prompt-injection text embedded in a document does not break the citation gate

### Usability & Docs

- [ ] **UIX-01**: A non-lawyer can follow the flow: upload → question → answer with cited source
- [ ] **UIX-02**: Clause list with page numbers, tier badges and escalation banner
- [ ] **DOC-01**: Public repo with MIT licence, README (overview, setup, run, config, troubleshooting), pinned dependencies
- [ ] **DOC-02**: Architecture explanation of how local processing is achieved
- [ ] **DOC-03**: Dataset sources, licences and attributions disclosed
- [ ] **DOC-04**: Testing results and known limitations stated honestly
- [ ] **DOC-05**: Instructions to reproduce the demo, plus a ~5-minute recording
- [ ] **DOC-06**: Short statement of the main technical contribution

## v2 Requirements (deferred)

- [ ] **V2-01**: Two-version comparison (diff two contracts, surface changed obligations) — {OPT}, only if everything else is green
- [ ] **V2-02**: Clause navigation and highlighting beyond the cited passage
- [ ] **V2-03**: Missing, conflicting or unusual clause detection
- [ ] **V2-04**: Confidence calibration across answers
- [ ] **V2-05**: Jurisdiction-aware warnings without legal conclusions
- [ ] **V2-06**: Local multilingual explanations
- [ ] **V2-07**: Local OCR for scanned documents
- [ ] **V2-08**: Local encryption and deletion controls

## Out of Scope

- **Any cloud service, hosted model API, cloud OCR or remote embeddings** — forbidden by the track rules; no private content may leave the device
- **Legal validity verdicts, enforceability opinions, "should I sign?"** — presenting output as legal advice is explicitly penalised; this is a hard product boundary
- **Snowflake / any cloud data platform** — the guide says do not build PS2 around one
- **Vector database** — one document at a time; a JSON file plus cosine similarity is the whole retrieval layer
- **CUAD as evidence for consumer documents** — CUAD holds commercial contracts only; the guide warns against presenting its results as proof for rental or employment documents
- **TypeScript build step** — adds failure modes to a demo that must run from a fresh clone on a judge's machine

## Document Scope

Stated honestly, per the guide's instruction to "state your scope honestly and test within it":

- **In scope**: rental agreements, employment contracts, legal notices, service agreements, in English
- **Test material**: CC BY 4.0 commercial contracts from CUAD (attributed, NeurIPS 2021 paper cited) plus clearly-labelled synthetic consumer fixtures for rental and employment, since CUAD contains neither
- **Out of scope**: legislation and court judgments as input documents — statutes are not contracts, and the guide warns never to derive legality conclusions from them

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ING-01 | Phase 1 | Complete |
| ING-02 | Phase 1 | Complete |
| ING-03 | Phase 1 | Complete |
| GRD-01 | Phase 1 | Complete |
| PRV-01 | Phase 1 | Complete |
| MDL-01 | Phase 1 | Complete |
| MDL-02 | Phase 1 | Complete |
| UND-01 | Phase 2 | Pending |
| GRD-02 | Phase 2 | Pending |
| GRD-03 | Phase 2 | Pending |
| UNC-01 | Phase 2 | Pending |
| UNC-02 | Phase 2 | Pending |
| UNC-03 | Phase 2 | Pending |
| UNC-04 | Phase 2 | Pending |
| PRV-02 | Phase 2 | Pending |
| PRV-03 | Phase 2 | Pending |
| PRV-04 | Phase 2 | Pending |
| UIX-01 | Phase 2 | Pending |
| UIX-02 | Phase 2 | Pending |
| UND-02 | Phase 3 | Pending |
| ROB-01 | Phase 3 | Pending |
| ROB-02 | Phase 3 | Pending |
| MDL-03 | Phase 3 | Pending |
| MDL-04 | Phase 4 | Pending |
| DOC-01 | Phase 4 | Pending |
| DOC-02 | Phase 4 | Pending |
| DOC-03 | Phase 4 | Pending |
| DOC-04 | Phase 4 | Pending |
| DOC-05 | Phase 4 | Pending |
| DOC-06 | Phase 4 | Pending |

Mapped: 30/30 — no orphans, no duplicates. See `.planning/ROADMAP.md`.
