import { useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'cinemaclub_theme';
const THEME_CHANGE_EVENT = 'cinemaclub_theme_changed';

/**
 * Checks whether the browser supports media queries for prefers-color-scheme.
 */
export const isColorSchemeSupported = (): boolean => {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
};

/**
 * Gets the system's preferred color scheme ('dark' or 'light').
 * Defaults to 'dark' if matchMedia is unavailable.
 */
export const getSystemTheme = (): ResolvedTheme => {
  if (!isColorSchemeSupported()) return 'dark';
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
};

/**
 * Reads the stored theme preference from localStorage.
 * Defaults to 'system' as requested (auto-detect works reliably in modern browsers).
 */
export const getStoredThemePreference = (): ThemePreference => {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (error) {
    console.warn('Unable to read theme from localStorage:', error);
  }
  return 'system';
};

/**
 * Resolves a preference ('system', 'light', or 'dark') into an actual active theme ('light' | 'dark').
 */
export const resolveTheme = (preference: ThemePreference): ResolvedTheme => {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
};

/**
 * Applies the resolved theme to the DOM (<html> class, data-theme attribute, colorScheme style, and meta theme-color).
 */
export const applyThemeToDOM = (resolved: ResolvedTheme): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
    if (body) {
      body.classList.add('dark');
      body.classList.remove('light');
      body.setAttribute('data-theme', 'dark');
    }
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    if (body) {
      body.classList.add('light');
      body.classList.remove('dark');
      body.setAttribute('data-theme', 'light');
    }
  }

  // Update mobile browser chrome header color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolved === 'dark' ? '#090a0f' : '#f4f6fa');
  }
};

/**
 * Sets the theme preference, persists it, updates DOM, and dispatches an event for all components.
 */
export const setThemePreference = (preference: ThemePreference): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (error) {
    console.warn('Unable to save theme to localStorage:', error);
  }

  const resolved = resolveTheme(preference);
  applyThemeToDOM(resolved);

  window.dispatchEvent(
    new CustomEvent(THEME_CHANGE_EVENT, {
      detail: { preference, resolved },
    }),
  );
};

/**
 * React hook to access and change the current theme preference and resolved theme.
 */
export const useTheme = () => {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredThemePreference());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredThemePreference()));

  useEffect(() => {
    // Initial DOM sync
    applyThemeToDOM(resolveTheme(getStoredThemePreference()));

    // Listen to in-app changes
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ preference: ThemePreference; resolved: ResolvedTheme }>;
      if (customEvent.detail) {
        setPreference(customEvent.detail.preference);
        setResolved(customEvent.detail.resolved);
      } else {
        const p = getStoredThemePreference();
        setPreference(p);
        setResolved(resolveTheme(p));
      }
    };
    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);

    // Listen to OS color scheme changes when in 'system' mode
    let mediaQuery: MediaQueryList | null = null;
    let handleMediaChange: ((e: MediaQueryListEvent) => void) | null = null;

    if (isColorSchemeSupported()) {
      try {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        handleMediaChange = (e: MediaQueryListEvent) => {
          const pref = getStoredThemePreference();
          if (pref === 'system') {
            const nextResolved: ResolvedTheme = e.matches ? 'dark' : 'light';
            setResolved(nextResolved);
            applyThemeToDOM(nextResolved);
          }
        };

        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleMediaChange);
        } else if ('addListener' in mediaQuery) {
          // Legacy Safari fallback
          (mediaQuery as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener(handleMediaChange);
        }
      } catch (err) {
        console.warn('Could not register prefers-color-scheme listener:', err);
      }
    }

    // Listen to storage events across browser tabs
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) {
        const nextPref = (event.newValue as ThemePreference) || 'system';
        const nextResolved = resolveTheme(nextPref);
        setPreference(nextPref);
        setResolved(nextResolved);
        applyThemeToDOM(nextResolved);
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
      window.removeEventListener('storage', handleStorage);
      if (mediaQuery && handleMediaChange) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMediaChange);
        } else if ('removeListener' in mediaQuery) {
          (mediaQuery as { removeListener: (cb: (e: MediaQueryListEvent) => void) => void }).removeListener(handleMediaChange);
        }
      }
    };
  }, []);

  const changeTheme = (newPref: ThemePreference) => {
    setThemePreference(newPref);
    setPreference(newPref);
    setResolved(resolveTheme(newPref));
  };

  return {
    themePreference: preference,
    resolvedTheme: resolved,
    setThemePreference: changeTheme,
    isDark: resolved === 'dark',
    isLight: resolved === 'light',
  };
};
