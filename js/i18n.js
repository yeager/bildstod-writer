// === Internationalization System ===
// Simple i18n with browser detection and localStorage persistence

let currentLang = 'en';
let translations = {};

// Initialize i18n
async function initI18n() {
  // Detect language from localStorage or browser
  const savedLang = localStorage.getItem('bildstod-writer-lang');
  const browserLang = navigator.language.toLowerCase().startsWith('sv') ? 'sv' : 'en';
  currentLang = savedLang || browserLang;

  // Load translations
  try {
    const resp = await fetch(`locales/${currentLang}.json?v=3`);
    translations = await resp.json();
  } catch (e) {
    console.warn('Failed to load translations, falling back to en');
    currentLang = 'en';
    try {
      const resp = await fetch('locales/en.json?v=3');
      translations = await resp.json();
    } catch {
      console.error('Critical: Could not load any translations');
      translations = {};
    }
  }

  // Update HTML lang attribute
  document.documentElement.lang = currentLang;
}

// Translation function
function t(key, fallback) {
  const value = translations[key];
  if (value) return value;
  
  // If no translation found, use fallback or key
  if (fallback) return fallback;
  
  console.warn(`Missing translation for key: ${key}`);
  return key;
}

// Change language
async function setLanguage(lang) {
  if (lang === currentLang) return;
  
  currentLang = lang;
  localStorage.setItem('bildstod-writer-lang', lang);
  
  try {
    const resp = await fetch(`locales/${lang}.json?v=3`);
    translations = await resp.json();
    document.documentElement.lang = lang;
    
    // Re-render all text that uses t() function
    updateAllTranslatedText();
    
  } catch (e) {
    console.error('Failed to load language:', lang);
  }
}

// Get current language
function getCurrentLanguage() {
  return currentLang;
}

// Export functions for global use
window.t = t;
window.setLanguage = setLanguage;
window.getCurrentLanguage = getCurrentLanguage;
window.initI18n = initI18n;