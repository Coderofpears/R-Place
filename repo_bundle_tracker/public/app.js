const state = {
  files: [],
  selected: null,
  selectedFile: null
};

const statsEl = document.getElementById("stats");
const listEl = document.getElementById("file-list");
const searchEl = document.getElementById("search");
const titleEl = document.getElementById("file-title");
const copyNameEl = document.getElementById("copy-name");
const copyCodeEl = document.getElementById("copy-code");
const metaEl = document.getElementById("meta-panel");
const codeEl = document.getElementById("code-view");
const heroCopyEl = document.getElementById("hero-copy");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function setStats(meta) {
  const items = [
    [meta.fileCount, "Tracked Files"],
    [meta.lastIndex, "Latest Index"]
  ];

  statsEl.innerHTML = items.map(([value, label]) => `
    <div class="stat">
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `).join("");
}

function renderList() {
  const query = searchEl.value.trim().toLowerCase();
  const files = !query
    ? state.files
    : state.files.filter((file) =>
        file.name.toLowerCase().includes(query) ||
        (file.originalName || "").toLowerCase().includes(query)
      );

  if (!files.length) {
    listEl.innerHTML = `<div class="empty">No files match that search.</div>`;
    return;
  }

  listEl.innerHTML = files.map((file) => `
    <button class="file ${state.selected === file.name ? "active" : ""}" data-file="${file.name}">
      <div class="file-name">${file.name}</div>
      <div class="file-meta">
        Original: ${file.originalName || "unknown"}<br>
        Size: ${formatBytes(file.size)}
      </div>
    </button>
  `).join("");

  for (const button of listEl.querySelectorAll("[data-file]")) {
    button.addEventListener("click", () => loadFile(button.dataset.file));
  }
}

function renderMeta(file) {
  metaEl.innerHTML = `
    <div class="meta-grid">
      <article>
        <h3>Normalized Name</h3>
        <p>${file.name}</p>
      </article>
      <article>
        <h3>Original Asset</h3>
        <p>${file.originalName || "unknown"}</p>
      </article>
      <article>
        <h3>File Size</h3>
        <p>${formatBytes(file.size)}</p>
      </article>
      <article>
        <h3>Updated</h3>
        <p>${new Date(file.updatedAt).toLocaleString()}</p>
      </article>
    </div>
  `;
}

async function loadFile(name) {
  if (!name) return;

  state.selected = name;
  renderList();

  titleEl.textContent = name;
  heroCopyEl.textContent = "Loading bundle source and metadata from the Bun API.";
  codeEl.textContent = "// loading...";

  const res = await fetch(`/api/file/${encodeURIComponent(name)}`);
  if (!res.ok) {
    heroCopyEl.textContent = "The selected file could not be loaded.";
    codeEl.textContent = "";
    metaEl.innerHTML = `<div class="empty">Failed to load metadata for ${name}.</div>`;
    return;
  }

  const file = await res.json();
  state.selectedFile = file;

  titleEl.textContent = file.name;
  heroCopyEl.textContent = `Mapped from ${file.originalName || "an unknown source asset"} and ready for inspection.`;
  renderMeta(file);
  codeEl.innerHTML = escapeHtml(file.contents);

  copyNameEl.disabled = false;
  copyCodeEl.disabled = false;
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch {
    button.textContent = "Copy failed";
    setTimeout(() => {
      button.textContent = button.id === "copy-code" ? "Copy Code" : "Copy Name";
    }, 1200);
  }
}

async function boot() {
  const [filesRes, healthRes] = await Promise.all([
    fetch("/api/files"),
    fetch("/api/health")
  ]);

  if (!filesRes.ok || !healthRes.ok) {
    titleEl.textContent = "API unavailable";
    heroCopyEl.textContent = "The frontend is up, but the Bun backend did not respond as expected.";
    return;
  }

  const payload = await filesRes.json();
  state.files = payload.files;

  setStats(payload.meta);
  renderList();

  if (state.files.length) {
    await loadFile(state.files[0].name);
  }
}

searchEl.addEventListener("input", renderList);
copyNameEl.addEventListener("click", () => {
  if (state.selectedFile) copyText(state.selectedFile.name, copyNameEl);
});
copyCodeEl.addEventListener("click", () => {
  if (state.selectedFile) copyText(state.selectedFile.contents, copyCodeEl);
});

boot();
