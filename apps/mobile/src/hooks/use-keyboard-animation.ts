import { useEffect } from 'react';
import {
  KeyboardEvents,
  useKeyboardHandler,
} from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

// Frame-synced keyboard tracking as reanimated shared values. `height` is the
// keyboard's current on-screen height in dp (0 when closed); `progress` runs
// 0→1 across the show animation. Both update every frame of the show/hide
// animation (and during interactive drag-to-dismiss), so layouts driven by
// them fall/rise WITH the keyboard instead of snapping after it settles —
// unlike useKeyboardState, whose discrete state only flips once the animation
// has already finished.
//
// react-native-keyboard-controller is the only reliable keyboard signal in
// this app: SDK 56's mandatory edge-to-edge on Android kills RN's own
// Keyboard events entirely (see the root layout's KeyboardProvider note).
export function useKeyboardAnimation() {
  const height = useSharedValue(0);
  const progress = useSharedValue(0);

  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        height.value = e.height;
        progress.value = e.progress;
      },
      onInteractive: (e) => {
        'worklet';
        height.value = e.height;
        progress.value = e.progress;
      },
      onEnd: (e) => {
        'worklet';
        height.value = e.height;
        progress.value = e.progress;
      },
    },
    []
  );

  // Belt-and-braces: RNKC's worklet-driven KAV once failed to move layout on
  // Android (see 835c189) while its JS KeyboardEvents kept working, so also
  // land the settled values from the JS emitter. If the worklet handlers ran,
  // these writes are no-ops; if they didn't, the layout still ends up correct
  // (just without the per-frame animation).
  useEffect(() => {
    const show = KeyboardEvents.addListener('keyboardDidShow', (e) => {
      height.value = e.height;
      progress.value = 1;
    });
    const hide = KeyboardEvents.addListener('keyboardDidHide', () => {
      height.value = 0;
      progress.value = 0;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [height, progress]);

  return { height, progress };
}
