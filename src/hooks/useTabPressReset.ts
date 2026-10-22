import { RefObject, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────
// Tapping a tab icon brings that tab's main screen back to the top.
//
//  • Tapping the tab you're already on → smooth scroll to top + refresh
//  • Tapping it from another tab        → opens already at the top
//    (the screen's own focus refresh then updates the data)
//
// Use on the ROOT screen of each tab (Dashboard, Goals, Deadlines,
// Insights) and pass the ref of its FlatList / SectionList / ScrollView.
// ─────────────────────────────────────────────────────────────

const scrollToTop = (list: any, animated: boolean) => {
  if (!list) return;
  if (typeof list.scrollToOffset === 'function') {
    list.scrollToOffset({ offset: 0, animated }); // FlatList
  } else if (typeof list.scrollTo === 'function') {
    list.scrollTo({ y: 0, animated }); // ScrollView
  } else if (typeof list.getScrollResponder === 'function') {
    list.getScrollResponder()?.scrollTo({ y: 0, animated }); // SectionList
  }
};

export function useTabPressReset(listRef: RefObject<any>, refresh?: () => void) {
  const navigation = useNavigation();

  useEffect(() => {
    // Screens live inside a stack, which lives inside the tab bar.
    // The stack's navigation object receives that tab's "tabPress" event.
    const tabRoute = navigation.getParent();
    if (!tabRoute) return;

    const unsubscribe = tabRoute.addListener('tabPress' as any, () => {
      const alreadyHere = navigation.isFocused();
      scrollToTop(listRef.current, alreadyHere);
      if (alreadyHere) refresh?.();
    });

    return unsubscribe;
  }, [navigation, listRef, refresh]);
}
