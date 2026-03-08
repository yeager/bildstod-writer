// === Skriv med bildstöd — Symbol-supported writing PWA ===

const BILDSTOD_API = '/bildstod/api/pictograms.json';
const ARASAAC_API = 'https://api.arasaac.org/v1/pictograms';
const ARASAAC_IMG = 'https://static.arasaac.org/pictograms';

// State
let bildstodData = null;
let symbolCache = new Map();
let currentWords = [];
let settings = loadSettings();

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  await loadBildstod();
  applySettings();
  bindEvents();
  registerSW();
});

async function loadBildstod() {
  try {
    const resp = await fetch(BILDSTOD_API);
    bildstodData = await resp.json();
    console.log(`Bildstöd loaded: ${bildstodData.pictograms.length} pictograms`);
  } catch (e) {
    console.warn('Bildstöd unavailable, using ARASAAC only');
    bildstodData = { pictograms: [] };
  }
}

// === SETTINGS ===
function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('bildstod-writer-settings')) || defaultSettings();
  } catch { return defaultSettings(); }
}
function defaultSettings() {
  return {
    size: 'medium', showText: true, textAbove: false,
    fontSize: 16, borders: true, bg: '#ffffff',
    speechRate: 0.8, sourceBildstod: true, sourceArasaac: true
  };
}
function saveSettings() {
  localStorage.setItem('bildstod-writer-settings', JSON.stringify(settings));
}
function applySettings() {
  const sizes = { small: 80, medium: 120, large: 160, xlarge: 200 };
  const px = sizes[settings.size] || 120;
  document.documentElement.style.setProperty('--symbol-size', px + 'px');
  document.documentElement.style.setProperty('--label-size', settings.fontSize + 'px');
  document.documentElement.style.setProperty('--board-bg', settings.bg);

  // Sync UI
  el('setting-size').value = settings.size;
  el('setting-show-text').checked = settings.showText;
  el('setting-text-above').checked = settings.textAbove;
  el('setting-font-size').value = settings.fontSize;
  el('setting-borders').checked = settings.borders;
  el('setting-bg').value = settings.bg;
  el('setting-speech-rate').value = settings.speechRate;
  el('speech-rate-label').textContent = settings.speechRate + 'x';
  el('setting-source-bildstod').checked = settings.sourceBildstod;
  el('setting-source-arasaac').checked = settings.sourceArasaac;
}

// === SYMBOL LOOKUP ===
async function findSymbol(word) {
  const key = word.toLowerCase().trim();
  if (!key) return null;
  if (symbolCache.has(key)) return symbolCache.get(key);

  let result = null;

  // 1. Search bildstöd first
  if (settings.sourceBildstod && bildstodData) {
    result = searchBildstod(key);
  }

  // 2. Fall back to ARASAAC
  if (!result && settings.sourceArasaac) {
    result = await searchArasaac(key);
  }

  symbolCache.set(key, result);
  return result;
}

function searchBildstod(word) {
  if (!bildstodData?.pictograms) return null;
  for (const p of bildstodData.pictograms) {
    const svKeys = p.keywords?.sv || [];
    const enKeys = p.keywords?.en || [];
    for (const kw of svKeys) {
      if (kw.toLowerCase() === word || kw.toLowerCase().includes(word)) {
        return {
          src: `/bildstod/${p.files.png_500}`,
          label: svKeys[0] || enKeys[0],
          source: 'bildstod',
          id: p.id
        };
      }
    }
  }
  return null;
}

async function searchArasaac(word) {
  try {
    // Try Swedish first
    let resp = await fetch(`${ARASAAC_API}/sv/search/${encodeURIComponent(word)}`);
    let data = resp.ok ? await resp.json() : [];
    
    if (!Array.isArray(data) || data.length === 0) {
      // Try English
      resp = await fetch(`${ARASAAC_API}/en/search/${encodeURIComponent(word)}`);
      data = resp.ok ? await resp.json() : [];
    }

    if (Array.isArray(data) && data.length > 0) {
      const p = data[0];
      const svKw = p.keywords?.find(k => k.locale === 'sv');
      return {
        src: `${ARASAAC_IMG}/${p._id}/${p._id}_300.png`,
        label: svKw?.keyword || word,
        source: 'arasaac',
        id: p._id,
        alternatives: data.slice(1, 8).map(a => ({
          src: `${ARASAAC_IMG}/${a._id}/${a._id}_300.png`,
          label: a.keywords?.find(k => k.locale === 'sv')?.keyword || word,
          id: a._id
        }))
      };
    }
  } catch (e) {
    console.warn('ARASAAC search failed:', e);
  }
  return null;
}

// === RENDERING ===
async function updateBoard() {
  const text = el('text-input').value;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  const board = el('symbols');
  const empty = el('empty-state');

  if (words.length === 0) {
    board.innerHTML = '';
    empty.classList.remove('hidden');
    currentWords = [];
    return;
  }
  empty.classList.add('hidden');
  currentWords = words;

  // Build cards
  const cards = await Promise.all(words.map(async (word, i) => {
    // Check for newline markers
    if (word === '\\n' || word === '|') {
      return '<div class="symbol-newline"></div>';
    }

    const sym = await findSymbol(word);
    const classes = ['symbol-card'];
    if (settings.borders) classes.push('bordered');
    if (settings.textAbove) classes.push('text-above');

    const imgHtml = sym
      ? `<img class="symbol-img" src="${sym.src}" alt="${sym.label}" loading="lazy" onerror="this.outerHTML='<div class=\\'symbol-placeholder\\'>${word[0].toUpperCase()}</div>'">`
      : `<div class="symbol-placeholder">${word[0].toUpperCase()}</div>`;

    const labelClass = settings.showText ? 'symbol-label' : 'symbol-label hidden';

    return `<div class="${classes.join(' ')}" data-index="${i}" data-word="${escHtml(word)}">${imgHtml}<span class="${labelClass}">${escHtml(word)}</span></div>`;
  }));

  board.innerHTML = cards.join('');

  // Bind click-to-pick
  board.querySelectorAll('.symbol-card').forEach(card => {
    card.addEventListener('click', () => openPicker(card.dataset.word, card.dataset.index));
  });
}

// === SYMBOL PICKER ===
async function openPicker(word, index) {
  const pickerEl = el('symbol-picker');
  const overlay = el('picker-overlay');
  el('picker-word').textContent = `"${word}" — välj bild`;

  const results = el('picker-results');
  results.innerHTML = '<p style="color:#999;padding:12px">Söker...</p>';
  
  pickerEl.classList.remove('hidden');
  overlay.classList.remove('hidden');

  // Search for alternatives
  const alternatives = [];
  
  // Bildstöd matches
  if (bildstodData) {
    for (const p of bildstodData.pictograms) {
      const svKeys = p.keywords?.sv || [];
      for (const kw of svKeys) {
        if (kw.toLowerCase().includes(word.toLowerCase())) {
          alternatives.push({
            src: `/bildstod/${p.files.png_500}`,
            label: svKeys[0],
            source: 'bildstod',
            id: p.id
          });
          break;
        }
      }
    }
  }

  // ARASAAC matches
  try {
    const resp = await fetch(`${ARASAAC_API}/sv/search/${encodeURIComponent(word)}`);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        for (const p of data.slice(0, 12)) {
          const svKw = p.keywords?.find(k => k.locale === 'sv');
          alternatives.push({
            src: `${ARASAAC_IMG}/${p._id}/${p._id}_300.png`,
            label: svKw?.keyword || word,
            source: 'arasaac',
            id: p._id
          });
        }
      }
    }
  } catch {}

  if (alternatives.length === 0) {
    results.innerHTML = '<p style="color:#999;padding:12px">Inga bilder hittades</p>';
    return;
  }

  results.innerHTML = alternatives.map((alt, i) =>
    `<div class="picker-item" data-idx="${i}"><img src="${alt.src}" alt="${alt.label}" loading="lazy"><span>${escHtml(alt.label)}</span></div>`
  ).join('');

  results.querySelectorAll('.picker-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      // Replace the cached symbol for this word
      const alt = alternatives[i];
      symbolCache.set(word.toLowerCase(), alt);
      closePicker();
      updateBoard();
    });
  });
}

function closePicker() {
  el('symbol-picker').classList.add('hidden');
  el('picker-overlay').classList.add('hidden');
}

// === SPEECH ===
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'sv-SE';
  utt.rate = settings.speechRate;
  // Try to find Swedish voice
  const voices = speechSynthesis.getVoices();
  const svVoice = voices.find(v => v.lang.startsWith('sv'));
  if (svVoice) utt.voice = svVoice;
  speechSynthesis.speak(utt);
}

// === SAVED SENTENCES ===
function getSaved() {
  try { return JSON.parse(localStorage.getItem('bildstod-writer-saved')) || []; }
  catch { return []; }
}
function setSaved(arr) { localStorage.setItem('bildstod-writer-saved', JSON.stringify(arr)); }

function saveCurrent() {
  const text = el('text-input').value.trim();
  if (!text) return;
  const saved = getSaved();
  if (!saved.includes(text)) {
    saved.unshift(text);
    if (saved.length > 50) saved.pop();
    setSaved(saved);
  }
}

function showSaved() {
  const saved = getSaved();
  const list = el('saved-list');
  const empty = el('saved-empty');

  if (saved.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = saved.map((s, i) =>
    `<div class="saved-item" data-idx="${i}"><span class="saved-text">${escHtml(s)}</span><button class="saved-delete" data-idx="${i}">✕</button></div>`
  ).join('');

  list.querySelectorAll('.saved-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('saved-delete')) {
        const idx = parseInt(e.target.dataset.idx);
        const s = getSaved();
        s.splice(idx, 1);
        setSaved(s);
        showSaved();
        return;
      }
      el('text-input').value = saved[parseInt(item.dataset.idx)];
      el('saved-panel').classList.add('hidden');
      updateBoard();
    });
  });
}

// === EVENTS ===
function bindEvents() {
  // Text input — update on every keystroke
  let debounceTimer;
  el('text-input').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateBoard, 300);
  });
  // Immediate update on space/enter
  el('text-input').addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      clearTimeout(debounceTimer);
      setTimeout(updateBoard, 50);
    }
  });

  // Quick buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = el('text-input');
      const text = btn.dataset.text;
      input.value = (input.value ? input.value + ' ' : '') + text + ' ';
      input.focus();
      updateBoard();
    });
  });

  // Speak
  el('btn-speak').addEventListener('click', () => speak(el('text-input').value));

  // Clear
  el('btn-clear').addEventListener('click', () => {
    el('text-input').value = '';
    updateBoard();
  });

  // Print
  el('btn-print').addEventListener('click', () => window.print());
  el('menu-print')?.addEventListener('click', () => { closeMenu(); window.print(); });

  // Settings panel
  el('btn-settings').addEventListener('click', () => el('settings-panel').classList.remove('hidden'));
  el('btn-close-settings').addEventListener('click', () => el('settings-panel').classList.add('hidden'));

  // Settings changes
  el('setting-size').addEventListener('change', (e) => { settings.size = e.target.value; saveSettings(); applySettings(); updateBoard(); });
  el('setting-show-text').addEventListener('change', (e) => { settings.showText = e.target.checked; saveSettings(); updateBoard(); });
  el('setting-text-above').addEventListener('change', (e) => { settings.textAbove = e.target.checked; saveSettings(); updateBoard(); });
  el('setting-font-size').addEventListener('change', (e) => { settings.fontSize = parseInt(e.target.value); saveSettings(); applySettings(); updateBoard(); });
  el('setting-borders').addEventListener('change', (e) => { settings.borders = e.target.checked; saveSettings(); updateBoard(); });
  el('setting-bg').addEventListener('change', (e) => { settings.bg = e.target.value; saveSettings(); applySettings(); });
  el('setting-speech-rate').addEventListener('input', (e) => {
    settings.speechRate = parseFloat(e.target.value);
    el('speech-rate-label').textContent = settings.speechRate + 'x';
    saveSettings();
  });
  el('setting-source-bildstod').addEventListener('change', (e) => { settings.sourceBildstod = e.target.checked; saveSettings(); symbolCache.clear(); updateBoard(); });
  el('setting-source-arasaac').addEventListener('change', (e) => { settings.sourceArasaac = e.target.checked; saveSettings(); symbolCache.clear(); updateBoard(); });

  // Menu
  el('btn-menu').addEventListener('click', openMenu);
  el('btn-close-menu').addEventListener('click', closeMenu);
  el('menu-overlay').addEventListener('click', closeMenu);
  el('menu-new').addEventListener('click', () => { el('text-input').value = ''; updateBoard(); closeMenu(); });
  el('menu-save').addEventListener('click', () => { saveCurrent(); closeMenu(); });
  el('menu-saved').addEventListener('click', () => { showSaved(); el('saved-panel').classList.remove('hidden'); closeMenu(); });
  el('menu-fullscreen')?.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
    closeMenu();
  });

  // Saved panel
  el('btn-close-saved').addEventListener('click', () => el('saved-panel').classList.add('hidden'));

  // Picker
  el('btn-close-picker').addEventListener('click', closePicker);
  el('picker-overlay').addEventListener('click', closePicker);

  // Install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  el('menu-install')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    }
    closeMenu();
  });
}

function openMenu() {
  el('side-menu').classList.remove('hidden');
  el('menu-overlay').classList.remove('hidden');
}
function closeMenu() {
  el('side-menu').classList.add('hidden');
  el('menu-overlay').classList.add('hidden');
}

// === HELPERS ===
function el(id) { return document.getElementById(id); }
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// === SERVICE WORKER ===
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW registration failed:', e));
  }
}
