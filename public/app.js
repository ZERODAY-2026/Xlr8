// public/app.js — the E1–E10 upload state machine (01-UI-SPEC contract) plus the browser
// ask slice (quick task browser-ask-ui; D-04 CLI-only lock intentionally lifted). Vanilla JS, no deps.
// Suggestion chips shown under the ask input
const SUGGESTIONS = [
  'what notice must be given to cancel?',
  'what are my rights under this agreement?',
  'what penalties or fees are specified?',
  'critical things I need to be aware of',
];

function renderSuggestions() {
  const container = document.getElementById('suggestions');
  if (!container) return;
  container.innerHTML = '';
  for (const q of SUGGESTIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-chip';
    btn.textContent = q;
    btn.addEventListener('click', () => {
      questionInput.value = q;
      questionInput.focus();
    });
    container.append(btn);
  }
}

const $ = (id) => document.getElementById(id);

const banner = $('banner');
const bannerText = $('banner-text');
const dropzone = $('dropzone');
const cta = $('cta');
const ctaLabel = $('cta-label');
const ctaSpinner = $('cta-spinner');
const fileInput = $('file-input');
const chosen = $('chosen');
const loadingCopy = $('loading-copy');
const progress = $('progress');
const docHeader = $('doc-header');
const docTitle = $('doc-title');
const removeBtn = $('remove-btn');
const list = $('list');
const noChunks = $('no-chunks');
const dialog = $('remove-dialog');
const dialogFilename = $('dialog-filename');
const confirmRemove = $('confirm-remove');
const cancelRemove = $('cancel-remove');
const askSection = $('ask');
const askForm = $('ask-form');
const questionInput = $('question');
const askBtn = $('ask-btn');
const askStatus = $('ask-status');
const answer = $('answer');
const answerText = $('answer-text');
const answerClaims = $('answer-claims');

// Copywriting Contract rows, verbatim. The server sends the error rows in its JSON body
// (server.js owns them for the API contract); the client mirrors them here and uses the
// model-failure row when the fetch itself fails (server unreachable — no body to read).
const ERR_SIZE = 'That file is 20 MB or over. Try a document under 20 MB and about 300 pages.';
const ERR_TYPE = 'That file type is not supported. Try a PDF or plain-text (.txt) document.';
const ERR_MODEL =
  'Processing failed on the local model. Check that Ollama is running (ollama serve), then upload again.';
const LOADING_COPY = 'Extracting pages → chunking → embedding locally. This can take a moment on CPU.';
// Browser ask slice: CPU inference takes 30–60s — button disabled + status, never aborted.
const THINKING_COPY = 'Thinking locally…';

let busy = false; // E2: one upload at a time; CTA disabled for the whole in-flight period
let current = null; // { docId, filename, chunks } — the single-document session

loadingCopy.textContent = LOADING_COPY;

function showBanner(message) {
  // E7: one banner at a time — the latest failure replaces any earlier banner.
  bannerText.textContent = message;
  banner.hidden = false;
}

function clearBanner() {
  banner.hidden = true;
  bannerText.textContent = '';
}

function endLoading() {
  busy = false;
  cta.disabled = false; // E2 error: CTA re-enabled for the retry the copy instructs
  ctaLabel.textContent = 'Upload agreement';
  ctaSpinner.hidden = true;
  loadingCopy.hidden = true;
  progress.hidden = true;
  removeBtn.disabled = false; // E3 loading: re-enabled once the session swap settles
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  clearBanner(); // E7 partial: a new selection clears the previous error
  chosen.textContent = file ? file.name : ''; // E1 partial: filename beside the chooser
  chosen.hidden = !file;
});

cta.addEventListener('click', () => {
  if (busy) return;
  const file = fileInput.files[0];
  if (!file) {
    fileInput.click();
    return;
  }
  upload(file);
});

async function upload(file) {
  busy = true;
  clearBanner(); // E7 loading: previous banner clears before the loading state appears
  cta.disabled = true; // E2 loading: disabled + relabelled for the whole in-flight period
  ctaLabel.textContent = 'Processing…';
  ctaSpinner.hidden = false;
  loadingCopy.hidden = false; // E1/E8 loading copy with spinner
  removeBtn.disabled = true; // E3 loading: a deletion cannot race the session swap
  if (current) progress.hidden = false; // E5 loading: replacement shows the top progress bar

  const fd = new FormData();
  fd.append('file', file);

  let res = null;
  let body = null;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: fd });
    body = await res.json().catch(() => null);
  } catch {
    res = null; // server unreachable — fall through to the model-failure row
  }

  if (!res || !res.ok) {
    // E5/E7 error: the banner carries the server's verbatim message; the previous
    // header and chunk list are left fully intact — no data loss.
    showBanner((body && body.error) || ERR_MODEL);
    endLoading();
    return;
  }

  // Success: render from the document record so the header filename is the original
  // name and the page numbers ride on each chunk (ING-03).
  let doc = null;
  try {
    const docRes = await fetch('/api/doc/' + encodeURIComponent(body.docId));
    if (docRes.ok) doc = await docRes.json();
  } catch {
    doc = null;
  }
  current = {
    docId: body.docId,
    filename: (doc && doc.filename) || body.filename,
    chunks: (doc && doc.chunks) || [],
  };
  render(current); // E4/E5/E6/E9/E10 populated — header + rows, or the no-chunks message
  endLoading();
}

function render(doc) {
  clearBanner();
  const n = doc.chunks.length;

  // E4: verbatim success header "{filename} — {N} chunks"; the filename ellipsizes in
  // place while the chunk count stays visible; 1 chunk singular, N chunks plural.
  const nameSpan = document.createElement('span');
  nameSpan.className = 'doc-name';
  nameSpan.textContent = doc.filename;
  const countSpan = document.createElement('span');
  countSpan.className = 'doc-count';
  countSpan.textContent = ` — ${n} ${n === 1 ? 'chunk' : 'chunks'}`;
  docTitle.replaceChildren(nameSpan, countSpan);
  docHeader.hidden = false;
  removeBtn.hidden = false; // E3 populated: the remove control exists only with a document

  list.replaceChildren();
  if (n === 0) {
    // E10: zero extracted chunks → the verbatim no-chunks message, never a blank list.
    list.hidden = true;
    noChunks.hidden = false;
    return;
  }
  noChunks.hidden = true;
  for (const c of doc.chunks) {
    const row = document.createElement('article');
    row.className = 'chunk-card';
    const chip = document.createElement('span');
    chip.className = 'page-chip';
    chip.textContent = `p. ${c.page}`; // E9: chrome chip, never accent
    const text = document.createElement('p');
    text.className = 'chunk-text'; // E6: 16/400/1.5, wraps fully — no ellipsis, no clamp
    text.textContent = c.text;
    row.append(chip, text);
    list.append(row);
  }
  list.hidden = false;
  askSection.hidden = false; // ask slice: the form exists only with a document loaded
  renderSuggestions();
}

removeBtn.addEventListener('click', () => {
  if (!current) return;
  dialogFilename.textContent = current.filename; // E3: verbatim destructive copy, filename filled
  dialog.showModal();
});

confirmRemove.addEventListener('click', () => {
  dialog.close();
  current = null;
  docHeader.hidden = true;
  removeBtn.hidden = true;
  list.hidden = true;
  list.replaceChildren();
  noChunks.hidden = true;
  askSection.hidden = true; // ask slice: no document → no ask form, no stale answer
  answer.hidden = true;
  questionInput.value = '';
  fileInput.value = '';
  chosen.hidden = true;
  chosen.textContent = '';
  clearBanner();
});

cancelRemove.addEventListener('click', () => dialog.close());

// Drag-and-drop onto the drop zone, exactly what the empty-state copy promises.
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer && e.dataTransfer.files[0];
  if (!file) return;
  const dt = new DataTransfer();
  dt.items.add(file);
  fileInput.files = dt.files;
  fileInput.dispatchEvent(new Event('change'));
});

// Browser ask slice — POST /api/ask against the most recently ingested document.
// Shares `busy` with upload: one in-flight request at a time, no session swap mid-ask.
askForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (busy) return;
  const question = questionInput.value.trim();
  if (!question) return;
  ask(question);
});

async function ask(question) {
  busy = true;
  clearBanner();
  answer.hidden = true; // the answer region is hidden until this ask is answered
  askBtn.disabled = true; // CPU inference 30–60s — disabled button, fetch never aborted
  askStatus.textContent = THINKING_COPY;
  askStatus.hidden = false;

  let res = null;
  let body = null;
  try {
    res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    body = await res.json().catch(() => null);
  } catch {
    res = null; // server unreachable — fall through to the model-failure row
  }

  askStatus.hidden = true;
  askBtn.disabled = false;
  busy = false;

  if (!res || !res.ok || body.unverifiable || !body.answer) {
    // Error and unverifiable-quote paths both land in the banner; the verified
    // quote is the only quote this UI will ever render.
    showBanner((body && (body.error || body.reason)) || ERR_MODEL);
    return;
  }
  answerText.textContent = body.answer; // plain text only — no HTML from the model
  // Additive claims array; a legacy server reply without it renders as one claim.
  renderClaims(Array.isArray(body.claims) && body.claims.length ? body.claims : [body]);
  answer.hidden = false;
}

function copyQuote(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.querySelector('svg').innerHTML = '<path d="M4.5 11.5 9 16 15.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.querySelector('svg').innerHTML = '<path d="M4.5 4 8.5 8 15.5 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M10.5 1 10.5 7 7 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    }, 1200);
  }).catch(() => {});
}

// One block per verified claim: page chip + verbatim quote (+ the claim's one-liner when
// present). A single verified claim renders exactly as the pre-multi-claim panel did.
function renderClaims(claims) {
  answerClaims.replaceChildren();
  for (const c of claims) {
    const block = document.createElement('blockquote');
    block.className = 'chunk-card answer-quote';
    const chip = document.createElement('span');
    chip.className = 'page-chip';
    chip.textContent = `p. ${c.page}`; // same chrome page-chip style as the list
    const col = document.createElement('div');
    col.className = 'answer-claim-body';
    const quote = document.createElement('p');
    quote.className = 'chunk-text';
    quote.textContent = c.quote;
    col.append(quote);
    if (typeof c.plain === 'string' && c.plain.trim() !== '') {
      const plain = document.createElement('p');
      plain.className = 'claim-plain';
      plain.textContent = c.plain;
      col.append(plain);
    }
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('aria-label', 'Copy quote to clipboard');
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 4 8.5 8 15.5 1" /><path d="M10.5 1 10.5 7 7 10.5" /></svg>';
    copyBtn.addEventListener('click', () => copyQuote(copyBtn, c.quote));
    col.append(copyBtn);
    block.append(chip, col);
    answerClaims.append(block);
  }
}
