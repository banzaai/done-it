/**
 * Done-it i18n loader
 * ─────────────────────────────────────────────────────────────────
 * Usage in every HTML page (before </body>):
 *   <script src="i18n/translations.js"></script>
 *   <script src="i18n.js"></script>
 *
 * HTML attributes:
 *   data-i18n="section.key"          → sets textContent
 *   data-i18n-html="section.key"     → sets innerHTML  (for headings with <br>/<span>)
 *   data-i18n-placeholder="section.key"  → sets placeholder on inputs/textareas
 *
 * Language switcher items:
 *   <a data-lang="fr">Français</a>
 *
 * Public API:
 *   window.setLang('fr')   — switch language programmatically
 * ─────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'done-it-lang';
  var DEFAULT_LANG = 'nl';
  var LANG_LABELS = {
    nl: '🇳🇱 NL ▾',
    fr: '🇫🇷 FR ▾',
    en: '🇬🇧 EN ▾',
    es: '🇪🇸 ES ▾'
  };

  /* ── helpers ── */

  function getLang() {
    var stored = localStorage.getItem(STORAGE_KEY);
    var T = window.TRANSLATIONS || {};
    return (stored && T[stored]) ? stored : DEFAULT_LANG;
  }

  /** Traverse a nested object with a dot-separated path, e.g. "home.hero_h1" */
  function getVal(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o && o[k] !== undefined ? o[k] : undefined;
    }, obj);
  }

  function applyTranslations() {
    var lang = getLang();
    var T = window.TRANSLATIONS;
    if (!T || !T[lang]) return;
    var t = T[lang];

    /* textContent */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = getVal(t, el.getAttribute('data-i18n'));
      if (val !== undefined) el.textContent = val;
    });

    /* innerHTML – for headings with <br>, <span style="..."> etc. */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var val = getVal(t, el.getAttribute('data-i18n-html'));
      if (val !== undefined) el.innerHTML = val;
    });

    /* placeholder on <input> / <textarea> */
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var val = getVal(t, el.getAttribute('data-i18n-placeholder'));
      if (val !== undefined) el.placeholder = val;
    });

    /* update <html lang=""> attribute */
    document.documentElement.lang = lang;

    /* update the lang-current button label */
    var btn = document.querySelector('.lang-current');
    if (btn) btn.textContent = LANG_LABELS[lang] || LANG_LABELS[DEFAULT_LANG];

    /* toggle lang-active class on switcher items */
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      var li = el.closest('li');
      if (li) li.classList.toggle('lang-active', el.getAttribute('data-lang') === lang);
    });
  }

  /* ── public API ── */

  window.setLang = function (lang) {
    var T = window.TRANSLATIONS || {};
    if (!T[lang]) { console.warn('Done-it i18n: unknown language "' + lang + '"'); return; }
    localStorage.setItem(STORAGE_KEY, lang);
    applyTranslations();
    if (typeof window._chatbotRefreshLang === 'function') window._chatbotRefreshLang();
  };

  /* ── wire up lang-switcher clicks ── */

  function wireLangSwitcher() {
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        window.setLang(el.getAttribute('data-lang'));
      });
    });
  }

  /* ── geo-based language detection (first visit only) ── */

  /**
   * Calls geo.kamero.ai to determine the visitor's country/continent and
   * picks a language accordingly.  The result is stored immediately so
   * every subsequent page load skips the network call.
   *
   * Rules:
   *   NA continent         → English
   *   EU / Spain (ES)      → Spanish
   *   EU / France (FR)     → French
   *   EU / Belgium (BE) or Netherlands (NL) → Dutch
   *   EU / other           → English
   *   anything else        → English
   *
   * Returns a Promise that resolves when done (or on failure).
   */
  function detectLangFromGeo() {
    return fetch('https://geo.kamero.ai/api/geo')
      .then(function (res) { return res.json(); })
      .then(function (geo) {
        var continent = geo.continent;
        var country   = geo.country;
        var lang;

        if (continent === 'NA') {
          lang = 'en';
        } else if (continent === 'EU') {
          if (country === 'ES') {
            lang = 'es';
          } else if (country === 'FR') {
            lang = 'fr';
          } else if (country === 'BE' || country === 'NL') {
            lang = 'nl';
          } else {
            lang = 'en';
          }
        } else {
          lang = 'en';
        }

        var T = window.TRANSLATIONS || {};
        if (T[lang]) {
          localStorage.setItem(STORAGE_KEY, lang);
        }
      })
      .catch(function () {
        /* silently fall back to DEFAULT_LANG */
      });
  }

  /* ── init ── */

  function init() {
    wireLangSwitcher();

    var stored = localStorage.getItem(STORAGE_KEY);
    var T = window.TRANSLATIONS || {};

    if (!stored || !T[stored]) {
      /* First visit: detect language from IP geolocation, then render */
      detectLangFromGeo().then(function () {
        applyTranslations();
      });
    } else {
      /* Returning visitor with a stored preference: render immediately */
      applyTranslations();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
