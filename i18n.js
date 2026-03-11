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

  /* ── init ── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wireLangSwitcher();
      applyTranslations();
    });
  } else {
    wireLangSwitcher();
    applyTranslations();
  }

})();
