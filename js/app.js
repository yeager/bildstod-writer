// === Skriv med bildstöd — Symbol-supported writing PWA ===
// Uses same ARASAAC lookup as autismapps launcher (15,607 sv translations)

const APP_VERSION = '2.0.0';
const APP_AUTHOR = 'Daniel Nylander';
const APP_LICENSE = 'Pictogram symbols: ARASAAC (CC BY-NC-SA 3.0) + Bildstöd (CC BY-NC-SA 3.0)';
const APP_URL = 'https://autismappar.se/skriv/';

const BILDSTOD_API = '/bildstod/api/pictograms.json';
const ARASAAC_IMG = 'https://static.arasaac.org/pictograms';
const ARASAAC_API = 'https://api.arasaac.org/v1/pictograms';

// Core AAC words missing from arasaac-sv.json (only standalone words not in the lookup)
const CORE_WORDS = {
  // Pronouns (not in sv lookup as standalone)
  'jag': 6632, 'du': 7090, 'han': 7091, 'hon': 7089, 'vi': 9811,
  'mig': 6632, 'dig': 7090, 'oss': 9811, 'hen': 7089,
  // Core verbs missing from sv lookup
  'behöver': 5441, 'vill': 5441, 'har': 32761, 'är': 5560, 'kan': 8297,
  'äter': 6456, 'dricker': 6061, 'leker': 23392, 'sover': 6479,
  'går': 7132, 'springer': 4628, 'sitter': 6452, 'står': 4637,
  'ser': 4607, 'tittar': 4607, 'hör': 2343, 'lyssnar': 2343,
  'läser': 25191, 'skriver': 35720, 'ritar': 4588, 'sjunger': 4590,
  'hjälper': 32648, 'gillar': 4581, 'gör': 8297, 'kommer': 4573,
  'ger': 5479, 'tar': 5479, 'öppnar': 4599, 'stänger': 4620,
  // Common adjectives/feelings
  'hungrig': 6456, 'törstig': 6061, 'sjuk': 35549,
  // Basic responses
  'snälla': 8195, 'förlåt': 5542,
  // English equivalents
  'i': 6632, 'you': 7090, 'he': 7091, 'she': 7089, 'we': 9811,
  'me': 6632, 'want': 5441, 'need': 5441, 'have': 32761, 'am': 5560,
  'eat': 6456, 'drink': 6061, 'play': 23392, 'sleep': 6479,
  'go': 7132, 'run': 4628, 'sit': 6452, 'stand': 4637,
  'see': 4607, 'look': 4607, 'hear': 2343, 'listen': 2343,
  'read': 25191, 'write': 35720, 'draw': 4588, 'sing': 4590,
  'help': 32648, 'like': 4581, 'do': 8297, 'come': 4573,
  'give': 5479, 'take': 5479, 'open': 4599, 'close': 4620,
  'hungry': 6456, 'thirsty': 6061, 'sick': 35549,
  'please': 8195, 'sorry': 5542,
};

// State
let bildstodData = null;   // Local Swedish/NPF pictograms
let svLookup = null;        // 15,607 en→sv ARASAAC translations
let symbolCache = new Map();
let currentWords = [];
let settings = loadSettings();

// === INIT ===
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n first
  await initI18n();
  
  // Load data and set up app
  await Promise.all([loadBildstod(), loadSvLookup()]);
  applySettings();
  updateAllTranslatedText();
  bindEvents();
  registerSW();
  
  // Show welcome screen on first visit
  checkWelcomeScreen();
});

function checkWelcomeScreen() {
  const welcomed = localStorage.getItem('bildstod-writer-welcomed');
  if (!welcomed) {
    showWelcomeScreen();
  }
}

function showWelcomeScreen() {
  // Update pictogram count
  const bildstodCount = bildstodData?.pictograms?.length || 0;
  const arasaacCount = svLookup ? Object.keys(svLookup).length : 0;
  const totalCount = bildstodCount + arasaacCount;
  el('pictogram-count').textContent = totalCount.toLocaleString();
  
  el('welcome-screen').classList.remove('hidden');
}

function hideWelcomeScreen() {
  el('welcome-screen').classList.add('hidden');
  localStorage.setItem('bildstod-writer-welcomed', 'true');
}

// Update all UI text with translations
function updateAllTranslatedText() {
  // Update document title and meta
  document.title = t('app_name');
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = t('app_description');
  
  // Header elements
  el('app-title').textContent = '✏️ ' + t('app_name');
  el('btn-menu').setAttribute('aria-label', t('header_menu'));
  el('btn-menu').setAttribute('title', t('header_menu'));
  el('btn-clear').setAttribute('aria-label', t('header_clear'));
  el('btn-clear').setAttribute('title', t('header_clear_all'));
  el('btn-print').setAttribute('aria-label', t('header_print'));
  el('btn-print').setAttribute('title', t('header_print'));
  el('btn-settings').setAttribute('aria-label', t('header_settings'));
  el('btn-settings').setAttribute('title', t('header_settings'));
  
  // Title input
  el('title-input').placeholder = t('title_field_placeholder');
  el('title-input').setAttribute('aria-label', t('title_field_placeholder'));
  
  // Empty state
  el('empty-state-text').textContent = t('empty_state_text');
  el('empty-state-hint').textContent = t('empty_state_hint');
  
  // Text input
  el('text-input').placeholder = t('input_placeholder');
  el('btn-speak').setAttribute('aria-label', t('btn_speak'));
  el('btn-speak').setAttribute('title', t('btn_speak_title'));
  
  // Quick phrase buttons
  document.querySelectorAll('.quick-btn[data-text-key]').forEach(btn => {
    const key = btn.getAttribute('data-text-key');
    const text = t(key);
    btn.textContent = text;
    btn.setAttribute('data-text', text);
  });
  
  // Settings panel
  el('settings-title').textContent = t('settings_title');
  el('settings-image-size-label').textContent = t('settings_image_size');
  el('settings-show-text-below-label').textContent = t('settings_show_text_below');
  el('settings-show-text-above-label').textContent = t('settings_show_text_above');
  el('settings-text-size-label').textContent = t('settings_text_size');
  el('settings-image-borders-label').textContent = t('settings_image_borders');
  el('settings-background-color-label').textContent = t('settings_background_color');
  el('settings-speech-rate-label').textContent = t('settings_speech_rate');
  el('settings-image-sources-label').textContent = t('settings_image_sources');
  el('settings-source-bildstod-label').textContent = t('settings_source_bildstod');
  el('settings-source-arasaac-label').textContent = t('settings_source_arasaac');
  el('settings-language-label').textContent = t('settings_language');
  
  // Update select options
  const sizeSelect = el('setting-size');
  sizeSelect.options[0].textContent = t('settings_image_size_small');
  sizeSelect.options[1].textContent = t('settings_image_size_medium');
  sizeSelect.options[2].textContent = t('settings_image_size_large');
  sizeSelect.options[3].textContent = t('settings_image_size_xlarge');
  
  const bgSelect = el('setting-bg');
  bgSelect.options[0].textContent = t('settings_bg_white');
  bgSelect.options[1].textContent = t('settings_bg_yellow');
  bgSelect.options[2].textContent = t('settings_bg_blue');
  bgSelect.options[3].textContent = t('settings_bg_purple');
  bgSelect.options[4].textContent = t('settings_bg_green');
  
  // Menu
  el('menu-title').textContent = '✏️ ' + t('menu_title');
  el('menu-new-text').textContent = t('menu_new');
  el('menu-save-text').textContent = t('menu_save');
  el('menu-saved-text').textContent = t('menu_saved');
  el('menu-print-text').textContent = t('menu_print');
  el('menu-fullscreen-text').textContent = t('menu_fullscreen');
  el('menu-about-text').textContent = t('menu_about');
  el('menu-install-text').textContent = t('menu_install');
  el('menu-home-text').textContent = t('menu_home_link');
  el('menu-footer-images').textContent = t('menu_footer_images');
  
  // Saved sentences
  el('saved-panel-title').textContent = t('saved_title');
  el('saved-empty').textContent = t('saved_empty');
  
  // Welcome screen
  el('welcome-title').textContent = t('welcome_title');
  el('welcome-description').textContent = t('welcome_description');
  el('welcome-how-to-title').textContent = t('welcome_how_to_use');
  el('welcome-step-1').textContent = t('welcome_step_1');
  el('welcome-step-2').textContent = t('welcome_step_2');
  el('welcome-step-3').textContent = t('welcome_step_3');
  el('welcome-step-4').textContent = t('welcome_step_4');
  el('welcome-pictograms-available').textContent = t('welcome_pictograms_available');
  el('welcome-get-started').textContent = t('welcome_get_started');
  
  // Example sentences
  document.querySelectorAll('.example-btn[data-example-key]').forEach(btn => {
    const key = btn.getAttribute('data-example-key');
    const text = t(key);
    btn.textContent = text;
    btn.setAttribute('data-example', text);
  });

  // Set language selector
  el('setting-language').value = getCurrentLanguage();
}

async function loadBildstod() {
  try {
    const resp = await fetch(BILDSTOD_API);
    bildstodData = await resp.json();
    console.log(`Bildstöd loaded: ${bildstodData.pictograms.length} pictograms`);
  } catch (e) {
    console.warn('Bildstöd unavailable');
    bildstodData = { pictograms: [] };
  }
}

async function loadSvLookup() {
  try {
    const resp = await fetch('arasaac-sv.json');
    svLookup = await resp.json();
    console.log(`Swedish ARASAAC lookup loaded: ${Object.keys(svLookup).length} entries`);
  } catch (e) {
    console.warn('Swedish lookup unavailable');
    svLookup = {};
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

// === SYMBOL LOOKUP (same logic as autismapps) ===
async function findSymbol(word) {
  const key = word.toLowerCase().trim().replace(/[.,!?;:'"()]/g, '');
  if (!key) return null;
  if (symbolCache.has(key)) return symbolCache.get(key);

  let result = null;

  // 1. Search bildstöd first (Swedish/NPF-specific concepts)
  if (settings.sourceBildstod && bildstodData) {
    result = searchBildstod(key);
  }

  // 2. Check core AAC words (pronouns, verbs not in sv lookup)
  if (!result && settings.sourceArasaac && CORE_WORDS[key]) {
    const id = CORE_WORDS[key];
    result = {
      src: `${ARASAAC_IMG}/${id}/${id}_300.png`,
      label: key,
      source: 'arasaac-core',
      id: id
    };
  }

  // 3. Search Swedish ARASAAC lookup (15,607 translations from Danne's sv.po)
  if (!result && settings.sourceArasaac && svLookup) {
    result = searchSvLookup(key);
  }

  // 4. Fallback: ARASAAC API search
  if (!result && settings.sourceArasaac) {
    result = await searchArasaacApi(key);
  }

  symbolCache.set(key, result);
  return result;
}

// Search local bildstöd pictograms
// Only returns exact or word-boundary matches (not substrings like "bil" in "bildstöd")
function searchBildstod(word) {
  if (!bildstodData?.pictograms) return null;
  
  let bestMatch = null;
  let bestScore = 0;
  
  for (const p of bildstodData.pictograms) {
    const svKeys = p.keywords?.sv || [];
    
    for (const kw of svKeys) {
      const kwLower = kw.toLowerCase();
      let score = 0;
      
      if (kwLower === word) {
        score = 100; // Exact match
      } else {
        // For multi-word keywords, check if search word matches a complete word
        const kwWords = kwLower.split(/[\s-]+/);
        if (kwWords.includes(word)) {
          score = 90; // Word boundary match ("lugna hörnan" matches "lugna")
        }
        // Only allow prefix/contains for longer search terms (5+ chars)
        // This prevents "bil" matching "bildstöd", "bild", etc.
        else if (word.length >= 5 && kwLower.startsWith(word)) {
          score = 60;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          src: `/bildstod/${p.png || p.files?.png_500 || p.svg}`,
          label: svKeys[0],
          source: 'bildstod',
          id: p.id
        };
      }
    }
  }
  return bestMatch;
}

// Search 15,607 en→sv ARASAAC translations
// Priority: Swedish value exact → English key exact → Swedish partial → English partial
function searchSvLookup(word) {
  if (!svLookup) return null;
  
  // 1. Exact match on SWEDISH value (prioritize user's language)
  // This prevents "barn" matching English "barn" (= ladugård)
  for (const [en, entry] of Object.entries(svLookup)) {
    if (entry.sv.toLowerCase() === word && entry.id) {
      return {
        src: `${ARASAAC_IMG}/${entry.id}/${entry.id}_300.png`,
        label: entry.sv,
        source: 'arasaac-sv',
        id: entry.id
      };
    }
  }
  
  // 2. Exact match on English key
  const exactEn = svLookup[word];
  if (exactEn && exactEn.id) {
    return {
      src: `${ARASAAC_IMG}/${exactEn.id}/${exactEn.id}_300.png`,
      label: exactEn.sv,
      source: 'arasaac-sv',
      id: exactEn.id
    };
  }
  
  // 3. Partial match — only for words with 4+ chars (avoid "bil" → "bild", "is" → "islam")
  if (word.length < 4) return null;
  
  let bestSv = null;
  let bestEn = null;
  
  for (const [en, entry] of Object.entries(svLookup)) {
    if (!entry.id) continue;
    const svLower = entry.sv.toLowerCase();
    
    // Only match if the search word matches a complete word boundary
    // e.g. "åka" should match "åka buss" but "bil" should NOT match "bild"
    const svWords = svLower.split(/[\s-]+/);
    if (!bestSv && svWords.some(w => w === word)) {
      bestSv = {
        src: `${ARASAAC_IMG}/${entry.id}/${entry.id}_300.png`,
        label: entry.sv,
        source: 'arasaac-sv',
        id: entry.id
      };
    }
    if (!bestSv && svLower.startsWith(word + ' ')) {
      bestSv = {
        src: `${ARASAAC_IMG}/${entry.id}/${entry.id}_300.png`,
        label: entry.sv,
        source: 'arasaac-sv',
        id: entry.id
      };
    }
    if (!bestEn && en === word) {
      bestEn = {
        src: `${ARASAAC_IMG}/${entry.id}/${entry.id}_300.png`,
        label: entry.sv,
        source: 'arasaac-sv',
        id: entry.id
      };
    }
  }
  
  return bestSv || bestEn || null;
}

// Fallback: ARASAAC API search (slow, requires network)
async function searchArasaacApi(word) {
  try {
    // Try Swedish first
    let resp = await fetch(`${ARASAAC_API}/sv/search/${encodeURIComponent(word)}`);
    let data = resp.ok ? await resp.json() : [];
    
    if (!Array.isArray(data) || data.length === 0) {
      resp = await fetch(`${ARASAAC_API}/en/search/${encodeURIComponent(word)}`);
      data = resp.ok ? await resp.json() : [];
    }

    if (Array.isArray(data) && data.length > 0) {
      const p = data[0];
      // Try to get Swedish keyword from local lookup
      const enKw = p.keywords?.[0]?.keyword || word;
      const svEntry = svLookup?.[enKw.toLowerCase()];
      const label = svEntry?.sv || p.keywords?.find(k => k.locale === 'sv')?.keyword || enKw;
      
      return {
        src: `${ARASAAC_IMG}/${p._id}/${p._id}_300.png`,
        label: label,
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

  const cards = await Promise.all(words.map(async (word, i) => {
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

  board.querySelectorAll('.symbol-card').forEach(card => {
    card.addEventListener('click', () => openPicker(card.dataset.word, card.dataset.index));
  });
}

// === SYMBOL PICKER ===
async function openPicker(word, index) {
  const pickerEl = el('symbol-picker');
  const overlay = el('picker-overlay');
  el('picker-word').textContent = `"${word}" — ${t('picker_choose_image')}`;

  const results = el('picker-results');
  results.innerHTML = `<p style="color:#999;padding:12px">${t('picker_searching')}</p>`;
  
  pickerEl.classList.remove('hidden');
  overlay.classList.remove('hidden');

  const alternatives = [];
  const seenIds = new Set();
  const wordLower = word.toLowerCase().replace(/[.,!?;:'"()]/g, '');

  // 1. Bildstöd matches
  if (bildstodData) {
    for (const p of bildstodData.pictograms) {
      const svKeys = p.keywords?.sv || [];
      for (const kw of svKeys) {
        if (kw.toLowerCase().includes(wordLower)) {
          const id = p.id + 900000;
          if (!seenIds.has(id)) {
            alternatives.push({
              src: `/bildstod/${p.png || p.files?.png_500 || p.svg}`,
              label: svKeys[0],
              source: 'bildstod',
              id: id
            });
            seenIds.add(id);
          }
          break;
        }
      }
    }
  }

  // 2. Swedish lookup matches (top 12)
  if (svLookup) {
    // Swedish value matches first
    for (const [en, entry] of Object.entries(svLookup)) {
      if (alternatives.length >= 20) break;
      if (!entry.id || seenIds.has(entry.id)) continue;
      if (entry.sv.toLowerCase().includes(wordLower)) {
        alternatives.push({
          src: `${ARASAAC_IMG}/${entry.id}/${entry.id}_300.png`,
          label: entry.sv,
          source: 'arasaac-sv',
          id: entry.id
        });
        seenIds.add(entry.id);
      }
    }
    // Then English key matches
    for (const [en, entry] of Object.entries(svLookup)) {
      if (alternatives.length >= 20) break;
      if (!entry.id || seenIds.has(entry.id)) continue;
      if (en.includes(wordLower)) {
        alternatives.push({
          src: `${ARASAAC_IMG}/${entry.id}/${entry.id}_300.png`,
          label: entry.sv,
          source: 'arasaac-sv',
          id: entry.id
        });
        seenIds.add(entry.id);
      }
    }
  }

  // 3. ARASAAC API fallback
  if (alternatives.length < 5) {
    try {
      const resp = await fetch(`${ARASAAC_API}/sv/search/${encodeURIComponent(word)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          for (const p of data.slice(0, 12)) {
            if (seenIds.has(p._id)) continue;
            const svKw = p.keywords?.find(k => k.locale === 'sv');
            alternatives.push({
              src: `${ARASAAC_IMG}/${p._id}/${p._id}_300.png`,
              label: svKw?.keyword || word,
              source: 'arasaac',
              id: p._id
            });
            seenIds.add(p._id);
          }
        }
      }
    } catch {}
  }

  if (alternatives.length === 0) {
    results.innerHTML = `<p style="color:#999;padding:12px">${t('picker_no_images')}</p>`;
    return;
  }

  results.innerHTML = alternatives.map((alt, i) =>
    `<div class="picker-item" data-idx="${i}"><img src="${alt.src}" alt="${alt.label}" loading="lazy"><span>${escHtml(alt.label)}</span></div>`
  ).join('');

  results.querySelectorAll('.picker-item').forEach((item, i) => {
    item.addEventListener('click', () => {
      const alt = alternatives[i];
      symbolCache.set(word.toLowerCase().replace(/[.,!?;:'"()]/g, ''), alt);
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
  
  // Set language based on current locale
  const lang = getCurrentLanguage();
  utt.lang = lang === 'sv' ? 'sv-SE' : 'en-US';
  utt.rate = settings.speechRate;
  
  const voices = speechSynthesis.getVoices();
  const langVoice = voices.find(v => v.lang.startsWith(lang));
  if (langVoice) utt.voice = langVoice;
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
  if (!text) {
    alert(t('alert_no_text_to_save'));
    return;
  }
  const saved = getSaved();
  if (!saved.includes(text)) {
    saved.unshift(text);
    if (saved.length > 50) saved.pop();
    setSaved(saved);
    alert(t('alert_saved'));
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
  let debounceTimer;
  el('text-input').addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateBoard, 300);
  });
  el('text-input').addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      clearTimeout(debounceTimer);
      setTimeout(updateBoard, 50);
    }
  });

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = el('text-input');
      const text = btn.dataset.text;
      input.value = (input.value ? input.value + ' ' : '') + text + ' ';
      input.focus();
      updateBoard();
    });
  });

  // Welcome screen
  el('welcome-get-started').addEventListener('click', hideWelcomeScreen);

  el('btn-speak').addEventListener('click', () => speak(el('text-input').value));
  el('btn-clear').addEventListener('click', () => { el('text-input').value = ''; el('title-input').value = ''; updateBoard(); });
  el('btn-print').addEventListener('click', printWithFooter);
  el('menu-print')?.addEventListener('click', () => { closeMenu(); printWithFooter(); });

  // Settings panel
  el('btn-settings').addEventListener('click', () => el('settings-panel').classList.remove('hidden'));
  el('btn-close-settings').addEventListener('click', () => el('settings-panel').classList.add('hidden'));

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

  // Language selector
  el('setting-language').addEventListener('change', async (e) => {
    await setLanguage(e.target.value);
  });

  // Menu
  el('btn-menu').addEventListener('click', openMenu);
  el('btn-close-menu').addEventListener('click', closeMenu);
  el('menu-overlay').addEventListener('click', closeMenu);
  el('menu-new').addEventListener('click', () => { el('text-input').value = ''; el('title-input').value = ''; updateBoard(); closeMenu(); });
  el('menu-save').addEventListener('click', () => { saveCurrent(); closeMenu(); });
  el('menu-saved').addEventListener('click', () => { showSaved(); el('saved-panel').classList.remove('hidden'); closeMenu(); });
  el('menu-about').addEventListener('click', () => { showWelcomeScreen(); closeMenu(); });
  el('menu-fullscreen')?.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
    closeMenu();
  });

  el('btn-close-saved').addEventListener('click', () => el('saved-panel').classList.add('hidden'));
  el('btn-close-picker').addEventListener('click', closePicker);
  el('picker-overlay').addEventListener('click', closePicker);

  // Example sentences
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el('text-input').value = btn.dataset.example;
      el('text-input').focus();
      updateBoard();
      // Hide examples after first use
      el('example-sentences').classList.add('hidden');
    });
  });

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

// === PRINT WITH FOOTER ===
function printWithFooter() {
  const title = el('title-input').value.trim();
  
  // Update print header: title (bold centered) + timestamp (top-right)
  const printTitleEl = document.querySelector('.print-title-text');
  if (printTitleEl) {
    printTitleEl.textContent = title || '';
  }
  
  const now = new Date();
  const timestamp = now.toLocaleDateString('sv-SE') + ' ' + 
                   now.toTimeString().substring(0, 5);
  const printTimestamp = document.querySelector('.print-timestamp');
  if (printTimestamp) {
    printTimestamp.textContent = timestamp;
  }
  
  // Update footer text (bottom-left)
  const footerText = document.querySelector('.print-footer-text');
  if (footerText) {
    footerText.textContent = t('print_footer');
  }
  
  window.print();
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