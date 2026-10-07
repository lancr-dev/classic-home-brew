'use strict';

(() => {
  const root = document.documentElement;
  const storageKey = 'classic-home-brew-theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

  const readPreference = () => {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      // The controls still work when browser privacy settings block storage.
      return null;
    }
  };

  let preference = readPreference();
  let currentTheme;

  const updateControls = () => {
    const isDark = currentTheme === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(isDark));
      button.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      button.hidden = false;
    });
  };

  const applyTheme = () => {
    currentTheme = preference ?? (systemTheme.matches ? 'dark' : 'light');
    root.dataset.theme = currentTheme;
    updateControls();
  };

  const initializeControls = () => {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        preference = currentTheme === 'dark' ? 'light' : 'dark';
        try {
          window.localStorage.setItem(storageKey, preference);
        } catch {
          // Keep the visitor's choice for this page if it cannot be saved.
        }
        applyTheme();
      });
    });
    updateControls();
  };

  systemTheme.addEventListener('change', () => {
    if (preference === null) applyTheme();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = readPreference();
    applyTheme();
  });

  // Run before the stylesheet is loaded so a saved dark theme does not flash light.
  applyTheme();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeControls, { once: true });
  } else {
    initializeControls();
  }
})();
