import { useState, useRef, useEffect, useCallback } from 'react';

export type PageMode = 'main' | 'entry' | 'roulette' | 'tournaments' | 'book-club';

export const parsePageFromHash = (hasAuth = false): PageMode => {
  if (typeof window === 'undefined') return 'main';
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (raw === 'roulette') return 'roulette';
  if (hasAuth || import.meta.env.DEV) {
    if (raw === 'tournaments' || raw === 'tournament') return 'tournaments';
    if (raw === 'book-club' || raw === 'books' || raw === 'book') return 'book-club';
    if (raw === 'entry' || raw === 'add') return 'entry';
  }
  return 'main';
};

interface UseAppNavigationOptions {
  isAuthorized: boolean;
  login: () => void;
}

export function useAppNavigation({ isAuthorized, login }: UseAppNavigationOptions) {
  const [page, setPage] = useState<PageMode>(() => parsePageFromHash(false));
  const [isAddMovieRequested, setIsAddMovieRequested] = useState(false);
  const pendingPageRef = useRef<PageMode | null>(null);
  const prevIsAuthorizedRef = useRef(false);

  const currentDisplayedPage: PageMode =
    !isAuthorized && !import.meta.env.DEV && page !== 'roulette' && page !== 'main'
      ? 'main'
      : page;

  // Navigation with browser history support (Back / Forward button works without leaving the site)
  const navigateToPage = useCallback(
    (newPage: PageMode, replace = false) => {
      if (!isAuthorized && newPage !== 'roulette' && newPage !== 'main') {
        pendingPageRef.current = newPage;
        if (newPage === 'entry') {
          setIsAddMovieRequested(true);
        }
        login();
        return;
      }
      pendingPageRef.current = null;
      setIsAddMovieRequested(false);
      setPage(newPage);
      const targetHash = newPage === 'main' ? '' : `#${newPage}`;
      if (window.location.hash !== targetHash) {
        const targetUrl = window.location.pathname + window.location.search + targetHash;
        if (replace) {
          window.history.replaceState({ page: newPage }, '', targetUrl);
        } else {
          window.history.pushState({ page: newPage }, '', targetUrl);
        }
      }
    },
    [isAuthorized, login]
  );

  // Capture initial deep-link hash if unauthorized on mount
  useEffect(() => {
    const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (raw === 'book-club' || raw === 'books' || raw === 'book') {
      pendingPageRef.current = 'book-club';
    } else if (raw === 'tournaments' || raw === 'tournament') {
      pendingPageRef.current = 'tournaments';
    } else if (raw === 'entry' || raw === 'add') {
      pendingPageRef.current = 'entry';
    }
  }, []);

  // Handle deferred navigation after successful authorization
  useEffect(() => {
    const wasAuthorized = prevIsAuthorizedRef.current;
    prevIsAuthorizedRef.current = isAuthorized;

    if (!wasAuthorized && isAuthorized) {
      const target = pendingPageRef.current ?? (isAddMovieRequested ? 'entry' : null);
      pendingPageRef.current = null;
      if (target) {
        const timer = setTimeout(() => {
          setIsAddMovieRequested(false);
          setPage(target);
          const targetHash = target === 'main' ? '' : `#${target}`;
          if (window.location.hash !== targetHash) {
            const targetUrl = window.location.pathname + window.location.search + targetHash;
            window.history.pushState({ page: target }, '', targetUrl);
          }
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthorized, isAddMovieRequested]);

  // Listen to browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const p = parsePageFromHash(isAuthorized);
      if (!isAuthorized && !import.meta.env.DEV && p !== 'roulette' && p !== 'main') {
        setPage('main');
        window.history.replaceState({ page: 'main' }, '', window.location.pathname + window.location.search);
      } else {
        setPage(p);
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, [isAuthorized]);

  // Strictly redirect away from protected pages if unauthorized
  useEffect(() => {
    if (!isAuthorized && !import.meta.env.DEV && page !== 'roulette' && page !== 'main') {
      window.history.replaceState({ page: 'main' }, '', window.location.pathname + window.location.search);
      queueMicrotask(() => {
        setPage('main');
      });
    }
  }, [isAuthorized, page]);

  return {
    page,
    currentDisplayedPage,
    isAddMovieRequested,
    setIsAddMovieRequested,
    navigateToPage,
  };
}
