// === Skriv med bildstöd — Symbol-supported writing PWA ===

const BILDSTOD_API = '/bildstod/api/pictograms.json';
const ARASAAC_API = 'https://api.arasaac.org/v1/pictograms';
const ARASAAC_IMG = 'https://static.arasaac.org/pictograms';

// Curated Swedish word → ARASAAC pictogram ID mapping
// Ensures common words get correct, meaningful pictograms
const SV_WORD_MAP = {
  // Pronouns
  'jag': 6632, 'du': 7090, 'han': 7091, 'hon': 7089, 'vi': 9811, 'de': 9812, 'dem': 9812,
  'mig': 6632, 'dig': 7090, 'oss': 9811, 'hen': 7089,
  // Core AAC verbs
  'vill': 5441, 'vill ha': 5441, 'ha': 32761, 'har': 32761, 'är': 5560, 'kan': 8297,
  'äta': 6456, 'äter': 6456, 'dricka': 6061, 'dricker': 6061,
  'leka': 23392, 'leker': 23392, 'spela': 23392,
  'sova': 6479, 'sover': 6479, 'vila': 6479,
  'gå': 7132, 'går': 7132, 'springa': 4628, 'springer': 4628,
  'sitta': 6452, 'sitter': 6452, 'stå': 4637, 'står': 4637,
  'se': 4607, 'ser': 4607, 'titta': 4607, 'tittar': 4607,
  'höra': 2343, 'hör': 2343, 'lyssna': 2343, 'lyssnar': 2343,
  'läsa': 25191, 'läser': 25191, 'skriva': 35720, 'skriver': 35720,
  'rita': 4588, 'ritar': 4588, 'måla': 4588, 'målar': 4588,
  'sjunga': 4590, 'sjunger': 4590, 'dansa': 6047, 'dansar': 6047,
  'hjälpa': 32648, 'hjälper': 32648, 'behöver': 5441,
  'gillar': 4581, 'gillar inte': 5504, 'tycker om': 4581,
  'gör': 8297, 'göra': 8297, 'komma': 4573, 'kommer': 4573,
  'ge': 5479, 'ger': 5479, 'ta': 5479, 'tar': 5479,
  'öppna': 4599, 'öppnar': 4599, 'stänga': 4620, 'stänger': 4620,
  'köpa': 5565, 'köper': 5565, 'betala': 5565,
  // Yes/No/Basic
  'ja': 5584, 'nej': 5526, 'tack': 6085, 'snälla': 8195, 'förlåt': 5542,
  'hjälp': 32648, 'stopp': 7196, 'vänta': 36914,
  'mer': 5508, 'klar': 28429, 'färdig': 28429, 'slut': 28429,
  'bra': 4581, 'dålig': 5504, 'dåligt': 5504,
  // Feelings
  'glad': 35533, 'ledsen': 35545, 'arg': 35541, 'rädd': 35544, 'trött': 6479,
  'hungrig': 6456, 'törstig': 6061, 'sjuk': 35549,
  // People
  'mamma': 2458, 'pappa': 2497, 'kompis': 25790, 'vän': 25790,
  'lärare': 32446, 'barn': 2345, 'bebis': 2453, 'familj': 2452,
  'pojke': 10278, 'flicka': 10096, 'bror': 2461, 'syster': 2454,
  // Food & Drink
  'mat': 4610, 'vatten': 32464, 'mjölk': 2445, 'juice': 2440,
  'bröd': 2494, 'smörgås': 2494, 'frukt': 2447, 'grönsaker': 2448,
  'glass': 2438, 'kaka': 2433, 'godis': 2433,
  'frukost': 4610, 'lunch': 4610, 'middag': 4610, 'mellanmål': 4610,
  'äpple': 2443, 'banan': 2444, 'köttbullar': 4610,
  'kebab': 4610, 'pizza': 2439, 'pasta': 2439, 'ris': 2449,
  'fisk': 2450, 'kyckling': 2450, 'korv': 4610,
  // Animals
  'hund': 7202, 'katt': 7114, 'häst': 7138, 'fågel': 2387,
  'fisk': 2387, 'kanin': 7180, 'ko': 7128,
  // Places
  'skola': 32446, 'hem': 6964, 'hemma': 6964, 'hus': 6964,
  'affär': 5565, 'butik': 5565, 'park': 36925, 'lekplats': 36925,
  'sjukhus': 32434, 'läkare': 32434, 'bibliotek': 25191,
  // Objects
  'bok': 25191, 'boll': 3241, 'bil': 2339, 'buss': 2329,
  'cykel': 2312, 'telefon': 2375, 'dator': 2370, 'iPad': 2370,
  'stol': 6452, 'bord': 6454, 'säng': 6479, 'dörr': 4599,
  'kläder': 8141, 'skor': 8141, 'jacka': 8141,
  // Adjectives
  'stor': 4658, 'liten': 4716, 'varm': 2300, 'kall': 4652,
  'snabb': 4628, 'långsam': 4637, 'ny': 4658, 'gammal': 4716,
  'fin': 4581, 'ful': 5504, 'rolig': 35533, 'tråkig': 35545,
  // Time/Place
  'nu': 36914, 'sedan': 36914, 'idag': 36914, 'imorgon': 36914,
  'här': 6964, 'där': 6964,
  'upp': 4658, 'ner': 4716, 'in': 4599, 'ut': 4620,
  // Colors
  'röd': 4677, 'blå': 4680, 'grön': 4678, 'gul': 4679,
  'vit': 4682, 'svart': 4681,
  // Question words
  'vad': 6895, 'var': 6895, 'vem': 6895, 'hur': 6895, 'varför': 6895, 'när': 6895,
  // School
  'penna': 35720, 'papper': 35720, 'sax': 4588, 'lim': 4588,
  // Body
  'huvud': 2343, 'hand': 32761, 'fot': 7132, 'mage': 6456, 'öga': 4607, 'öra': 2343,
  // Weather
  'sol': 2300, 'regn': 4652, 'snö': 4652,
  // Actions at school
  'lyssna': 2343, 'räcka upp handen': 32648, 'sitt still': 6452,
};

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
  const key = word.toLowerCase().trim().replace(/[.,!?;:'"()]/g, '');
  if (!key) return null;
  if (symbolCache.has(key)) return symbolCache.get(key);

  let result = null;

  // 1. Search bildstöd first (Swedish/NPF-specific)
  if (settings.sourceBildstod && bildstodData) {
    result = searchBildstod(key);
  }

  // 2. Check curated Swedish word map (ensures correct pictograms)
  if (!result && settings.sourceArasaac && SV_WORD_MAP[key]) {
    const id = SV_WORD_MAP[key];
    result = {
      src: `${ARASAAC_IMG}/${id}/${id}_300.png`,
      label: key,
      source: 'arasaac-curated',
      id: id
    };
  }

  // 3. Fall back to ARASAAC search API
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
