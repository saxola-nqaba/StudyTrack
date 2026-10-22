import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { showError } from '../utils/errors';

// ─────────────────────────────────────────────────────────────
// Loads a screen's data every time the screen comes into focus.
//
//  • First visit       → full-screen spinner (nothing to show yet)
//  • Coming back later → keeps the current data on screen and
//                        refreshes quietly in the background
//  • Pull down         → refresh with the pull-to-refresh spinner
//
// If a quiet background refresh fails, the data already on screen
// stays and no popup appears. First loads and pulls do show an error.
// ─────────────────────────────────────────────────────────────

export function useFocusLoad(load: () => Promise<void>, errorTitle: string) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);

  // Always call the latest version of `load` (it may use new route params)
  const loadRef = useRef(load);
  loadRef.current = load;

  const run = useCallback(
    async (mode: 'focus' | 'pull') => {
      if (mode === 'pull') setRefreshing(true);
      else if (!hasLoaded.current) setLoading(true);

      try {
        await loadRef.current();
        hasLoaded.current = true;
      } catch (e) {
        if (!hasLoaded.current || mode === 'pull') showError(errorTitle, e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [errorTitle]
  );

  useFocusEffect(
    useCallback(() => {
      run('focus');
    }, [run])
  );

  const onRefresh = useCallback(() => run('pull'), [run]);
  // Refresh without any spinner (used when re-tapping the active tab)
  const refreshQuietly = useCallback(() => run('focus'), [run]);

  return { loading, refreshing, onRefresh, refreshQuietly };
}
