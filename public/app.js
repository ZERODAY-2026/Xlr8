// public/app.js — the E1–E10 upload state machine (01-UI-SPEC contract; D-04 scope lock:
// upload shell + page-cited chunk list ONLY — no Q&A UI this phase). Vanilla JS, no deps.
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

// Copywriting Contract rows, verbatim. The server sends the error rows in its JSON body
// (server.js owns them for the API contract); the client mirrors them here and uses the
// model-failure row when the fetch itself fails (server unreachable — no body to read).
const ERR_SIZE = 'That file is 20 MB or over. Try a document under 20 MB and about 300 pages.';
const ERR_TYPE = 'That file type is not supported. Try a PDF or plain-text (.txt) document.';
const ERR_MODEL =
  'Processing failed on the local model. Check that Ollama is running (ollama serve), then upload again.';
const LOADING_COPY = 'Extracting pages → chunking → embedding locally. This can take a moment on CPU.';

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
