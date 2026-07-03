// Navigation helpers shared across the native-tabs stacks.

// The subset of a stack screen's navigation prop we touch. Typed structurally so
// this stays decoupled from expo-router's generic param lists; the real
// `NativeStackNavigationProp` passed by `screenListeners` is assignable to it.
interface TabStackNavigation {
  popToTop: () => void;
  getParent: () => { isFocused: () => boolean } | undefined;
  getState: () => { routes: unknown[] };
}

/**
 * `screenListeners` for a tab's `<Stack>` that resets it to its root whenever
 * the user leaves the tab, so tapping a bottom-tab item always lands on that
 * tab's home screen instead of the deep screen it was left on.
 *
 * A stack screen's `blur` fires in two cases: an in-tab push (the covered
 * screen blurs) *and* a tab switch (the focused screen blurs). We only pop when
 * the parent native-tabs navigator is no longer focused — i.e. an actual tab
 * switch — so navigating deeper within a tab is untouched. The pop happens
 * off-screen as the tab animates away, so there's no visible flash.
 */
export function resetStackOnTabBlur({
  navigation,
}: {
  navigation: TabStackNavigation;
}) {
  return {
    blur: () => {
      const parent = navigation.getParent();
      // Only reset on a real tab switch (parent tabs navigator lost focus),
      // and only when there's actually something to pop — dispatching
      // POP_TO_TOP on a single-screen stack goes unhandled and warns.
      if (
        parent &&
        !parent.isFocused() &&
        navigation.getState().routes.length > 1
      ) {
        navigation.popToTop();
      }
    },
  };
}
