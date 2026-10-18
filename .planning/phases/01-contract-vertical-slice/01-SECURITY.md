---
phase: "01"
slug: contract-vertical-slice
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-18"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| document file → parser | Uploaded/selected PDF or TXT bytes are hostile input | User document text (may embed adversarial content) |
| npm install → machine | Third-party packages execute at install time | Arbitrary install-time code |
| question + retrieved chunks → model prompt | Document text enters the LLM prompt; document-embedded instructions are untrusted | Retrieved chunk text as prompt context |
| app → 127.0.0.1:11434 | The only permitted outbound socket; anything else breaks PRV-01 and the track rules | Document text/chunks to the local model |
| browser → POST /api/upload | Untrusted multipart input (type, size, filename, content) crosses here | Uploaded file bytes |
| server → disk ./data/ | Uploaded bytes and derived artifacts are written to disk | File content and generated paths |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | lib/parse.js (hostile PDF input) | medium | mitigate | pdfjs legacy build with `isEvalSupported: false`; PDFs parsed from in-memory bytes only; no eval of document or model content (grep-verified in lib/parse.js) | closed |
| T-01-02 | Information Disclosure | fixture/test write paths | low | mitigate | Tests read-only over fixtures; scratch writes target gitignored `./data/` and `chunks.json` only (`.gitignore` grep-verified) | closed |
| T-01-SC | Tampering | npm installs (express, multer, pdfjs-dist) | high | mitigate | Package Legitimacy Audit (01-RESEARCH.md) + blocking-human Task-0 checkpoint completed with human approval 2026-10-18; exact pins express@5.3.0, multer@2.4.0, pdfjs-dist@6.4.299; no postinstall scripts (package.json grep-verified) | closed |
| T-01-03 | Information Disclosure | lib/ollama.js + lib/embed.js egress | high | mitigate | `OLLAMA_BASE` hard-coded loopback with no env override; built-in fetch is the only HTTP client; PRV-01 sampler recorded loopback-only sockets during a full ask run (01-02-SUMMARY.md) | closed |
| T-01-04 | Tampering | document-embedded prompt injection via retrieved chunks | medium | mitigate | Chunks enter only as delimited quoted context; system prompt treats excerpts as document content, not instructions; `verify()` drops any fabricated quote (lib/pipeline.js grep-verified; invented-quote test passes) | closed |
| T-01-05 | Denial of Service | Ollama down, slow, or schema-less JSON | low | mitigate | One retry then `gemma3:4b` fallback; JSON.parse in try/catch with field validation; structured `ERROR:` line and exit 1; top-k 6 (lib/ollama.js grep-verified; 4 retry/fallback tests pass) | closed |
| T-01-06 | Tampering | POST /api/upload filename/size/type abuse | medium | mitigate | `crypto.randomUUID()` storage names (client name never becomes a path); 20 MB `fileSize`; `.pdf/.txt` `fileFilter`; 300-page cap post-parse (server.js grep-verified) | closed |
| T-01-07 | Information Disclosure | server exposure | medium | mitigate | `app.listen(3000, '127.0.0.1')` only; public/ scan shows no non-loopback URL (grep-verified) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-18 | 8 | 8 | 0 | gsd-secure-phase (L1 grep-depth, register authored at plan time, ASVS 1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-18
