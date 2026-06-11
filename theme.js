(function() {
  'use strict';

  var STORAGE_KEY = 'vain-theme';
  var THEME_LIGHT = 'light';
  var THEME_DARK = 'dark';

  function getPreferredTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return THEME_DARK;
    return THEME_LIGHT;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme === THEME_DARK ? THEME_DARK : '');
    updateToggleButtons(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch(e) {}
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  }

  function updateToggleButtons(theme) {
    var isDark = theme === THEME_DARK;
    document.querySelectorAll('[data-theme-toggle]').forEach(function(btn) {
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      var sunIcon = btn.querySelector('.theme-icon-sun');
      var moonIcon = btn.querySelector('.theme-icon-moon');
      if (sunIcon) sunIcon.style.display = isDark ? 'none' : '';
      if (moonIcon) moonIcon.style.display = isDark ? '' : 'none';
      var label = btn.querySelector('.theme-toggle-label');
      if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
  }

  function createToggleButton() {
    var btn = document.createElement('button');
    btn.className = 'icon-btn theme-toggle-btn';
    btn.setAttribute('data-theme-toggle', '');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.innerHTML =
      '<svg class="theme-icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>' +
      '<svg class="theme-icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.addEventListener('click', toggleTheme);
    return btn;
  }

  function init() {
    var theme = getPreferredTheme();
    applyTheme(theme);

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem(STORAGE_KEY)) applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
      });
    }

    document.querySelectorAll('[data-theme-toggle]').forEach(function(btn) {
      btn.addEventListener('click', toggleTheme);
      var isDark = theme === THEME_DARK;
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      var sunIcon = btn.querySelector('.theme-icon-sun');
      var moonIcon = btn.querySelector('.theme-icon-moon');
      if (sunIcon) sunIcon.style.display = isDark ? 'none' : '';
      if (moonIcon) moonIcon.style.display = isDark ? '' : 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  window.VainTheme = {
    toggle: toggleTheme,
    getTheme: function() { return document.documentElement.getAttribute('data-theme') === THEME_DARK ? THEME_DARK : THEME_LIGHT; },
    createToggleButton: createToggleButton
  };
})();
