import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { Share, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { fileNameFromPath } from '@/lib/attachments';

export type SignedUrlResult = Promise<{
  data: { signedUrl: string } | null;
  error: unknown;
}>;

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

function clampPan(value: number, extent: number): number {
  'worklet';
  return Math.min(extent, Math.max(-extent, value));
}

// Fullscreen in-app viewer for image attachments — pinch/pan/double-tap zoom
// over a fixed dark ground (like the system photo viewer, independent of the
// app theme), with a share action that downloads the object to the app cache
// and opens the system share sheet (Save Image / Save to Files / AirDrop / …).
// Signed URLs are short-lived, so a fresh one is resolved every time the
// viewer opens and again when sharing — never reuse the thumbnail's URL.
export function AttachmentViewer({
  visible,
  onClose,
  storagePath,
  mimeType,
  getSignedUrl,
}: {
  visible: boolean;
  onClose: () => void;
  storagePath: string;
  mimeType: string | null;
  getSignedUrl: (path: string) => SignedUrlResult;
}) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [sharing, setSharing] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void getSignedUrl(storagePath).then((res) => {
      if (cancelled) return;
      if (res.data?.signedUrl) setUrl(res.data.signedUrl);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, storagePath, getSignedUrl]);

  // Clear the resolved URL on close (it expires within a minute) so a reopen
  // shows the loader and fetches a fresh one instead of flashing a dead link.
  function handleClose() {
    setUrl(null);
    setFailed(false);
    onClose();
  }

  // Zoom state resets in the Modal's onShow event (not the effect above — the
  // React Compiler forbids mutating effect-captured values inside effects).
  function resetZoom() {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  }

  async function share() {
    setSharing(true);
    try {
      const res = await getSignedUrl(storagePath);
      const signedUrl = res.data?.signedUrl;
      if (!signedUrl) throw new Error('sign failed');
      const dest = `${FileSystem.cacheDirectory}${fileNameFromPath(storagePath)}`;
      const { uri } = await FileSystem.downloadAsync(signedUrl, dest);
      if (!(await Sharing.isAvailableAsync())) throw new Error('unavailable');
      await Sharing.shareAsync(uri, mimeType ? { mimeType } : undefined);
    } catch {
      Alert.alert(t('attachment.shareError'));
    } finally {
      setSharing(false);
    }
  }

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      const next = Math.min(MAX_SCALE, Math.max(1, scale.value));
      const nx = clampPan(tx.value, ((next - 1) * width) / 2);
      const ny = clampPan(ty.value, ((next - 1) * height) / 2);
      scale.value = withTiming(next);
      tx.value = withTiming(nx);
      ty.value = withTiming(ny);
      savedScale.value = next;
      savedTx.value = nx;
      savedTy.value = ny;
    });

  const pan = Gesture.Pan()
    .minDistance(10)
    .maxPointers(1)
    .onUpdate((e) => {
      if (savedScale.value <= 1) return;
      const ex = ((savedScale.value - 1) * width) / 2;
      const ey = ((savedScale.value - 1) * height) / 2;
      tx.value = clampPan(savedTx.value + e.translationX, ex);
      ty.value = clampPan(savedTy.value + e.translationY, ey);
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (savedScale.value > 1) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
      } else {
        // Translate so the tapped point ends up centered after scaling.
        const s = DOUBLE_TAP_SCALE;
        const nx = clampPan((width / 2 - e.x) * s, ((s - 1) * width) / 2);
        const ny = clampPan((height / 2 - e.y) * s, ((s - 1) * height) / 2);
        scale.value = withTiming(s);
        tx.value = withTiming(nx);
        ty.value = withTiming(ny);
        savedScale.value = s;
        savedTx.value = nx;
        savedTy.value = ny;
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal
      visible={visible}
      animationType='fade'
      statusBarTranslucent
      onShow={resetZoom}
      onRequestClose={handleClose}
    >
      {visible ? <StatusBar style='light' /> : null}
      {/* RN Modals detach from the app's gesture root, so the detector needs
          its own root inside the modal (Android would silently drop gestures). */}
      <GestureHandlerRootView style={styles.fill}>
        <View style={styles.backdrop}>
          {failed ? (
            <AppText variant='bodyMedium' style={styles.errorText}>
              {t('attachment.previewUnavailable')}
            </AppText>
          ) : url ? (
            <GestureDetector gesture={gesture}>
              <Animated.View style={styles.canvas}>
                <Animated.View style={[styles.fill, imageStyle]}>
                  <Image
                    source={{ uri: url }}
                    style={styles.fill}
                    contentFit='contain'
                    onError={() => setFailed(true)}
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          ) : (
            <ActivityIndicator color={CHROME_FG} />
          )}

          <View style={[styles.chrome, { top: insets.top + Spacing.two }]}>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={t('actions.close')}
              onPress={handleClose}
              hitSlop={8}
              style={({ pressed }) => [
                styles.chromeButton,
                pressed && styles.chromeButtonPressed,
              ]}
            >
              <X size={20} color={CHROME_FG} />
            </Pressable>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={t('attachment.share')}
              onPress={() => void share()}
              disabled={sharing || failed}
              hitSlop={8}
              style={({ pressed }) => [
                styles.chromeButton,
                pressed && styles.chromeButtonPressed,
              ]}
            >
              {sharing ? (
                <ActivityIndicator size='small' color={CHROME_FG} />
              ) : (
                <Share size={20} color={CHROME_FG} />
              )}
            </Pressable>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// The viewer is always dark regardless of app theme, so its chrome colors are
// fixed rather than theme tokens.
const CHROME_FG = '#ffffff';

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
  backdrop: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  errorText: { color: CHROME_FG },
  chrome: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Dark scrim, not translucent white — the buttons float over the image, and
  // receipts are mostly white, which would swallow a white-tinted circle.
  chromeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chromeButtonPressed: { opacity: 0.6 },
});
