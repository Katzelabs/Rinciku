import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { FileText, ImagePlus, X } from '@/lib/icons';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  AttachmentViewer,
  type SignedUrlResult,
} from '@/components/attachment-viewer';
import { AppText, FieldLabel } from '@/components/ui';
import { Border, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  fileNameFromPath,
  pickDocument,
  pickImage,
  type PickedImage,
  type PickOutcome,
  type PickSource,
} from '@/lib/attachments';

export type ExistingAttachment = {
  storage_path: string;
  mime_type: string | null;
};

// Read-only attachment chip for detail screens. Shows the file name; tapping
// resolves a fresh short-lived signed URL (the buckets are private) and opens
// the file in the in-app browser sheet (SFSafariViewController / Custom Tab —
// the user never leaves the app, and gets native PDF rendering + share for
// free). We deliberately don't render a thumbnail — a fixed-height row keeps
// the layout stable and avoids a full-size image load.
export function ReceiptPreview({
  storagePath,
  getSignedUrl,
  onPress,
}: {
  storagePath: string;
  getSignedUrl: (path: string) => SignedUrlResult;
  onPress?: () => void;
}) {
  const c = useTheme();
  const { t } = useTranslation('common');

  async function open() {
    if (onPress) return onPress();
    const res = await getSignedUrl(storagePath);
    const url = res.data?.signedUrl;
    if (!url) {
      Alert.alert(t('receiptPicker.openError'));
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert(t('receiptPicker.openError'));
    }
  }

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={t('attachment.open')}
      onPress={() => void open()}
      style={({ pressed }) => [
        styles.chip,
        styles.chipShrink,
        { borderColor: c.border, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <FileText size={16} color={c.mutedForeground} />
      <AppText
        variant='bodyMedium'
        color='primary'
        numberOfLines={1}
        style={styles.chipName}
      >
        {fileNameFromPath(storagePath)}
      </AppText>
    </Pressable>
  );
}

// Bounded image preview for detail screens. Resolves a signed URL and renders
// the receipt at a fixed height (contain, so the whole receipt is visible);
// tapping opens the in-app fullscreen viewer (zoom + share/download). Non-image
// attachments (PDFs) and load failures fall back to the openable file-name chip.
export function ReceiptImage({
  storagePath,
  mimeType,
  getSignedUrl,
}: {
  storagePath: string;
  mimeType: string | null;
  getSignedUrl: (path: string) => SignedUrlResult;
}) {
  const c = useTheme();
  const { t } = useTranslation('common');
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isImage = !!mimeType && mimeType.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    void getSignedUrl(storagePath).then((res) => {
      if (cancelled) return;
      if (res.data?.signedUrl) setUrl(res.data.signedUrl);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [isImage, storagePath, getSignedUrl]);

  if (!isImage || failed) {
    return (
      <ReceiptPreview storagePath={storagePath} getSignedUrl={getSignedUrl} />
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole='imagebutton'
        accessibilityLabel={t('attachment.openFullSize')}
        onPress={() => setViewerOpen(true)}
        style={[
          styles.imageWrap,
          { borderColor: c.border, backgroundColor: c.muted },
        ]}
      >
        {url ? (
          <Image
            source={{ uri: url }}
            style={styles.image}
            contentFit='contain'
            onError={() => setFailed(true)}
          />
        ) : (
          <ActivityIndicator color={c.mutedForeground} />
        )}
      </Pressable>

      <AttachmentViewer
        visible={viewerOpen}
        onClose={() => setViewerOpen(false)}
        storagePath={storagePath}
        mimeType={mimeType}
        getSignedUrl={getSignedUrl}
      />
    </>
  );
}

type Props = {
  label: string;
  value: PickedImage | null;
  onChange: (value: PickedImage | null) => void;
  existing?: ExistingAttachment | null;
  removed: boolean;
  onRemovedChange: (removed: boolean) => void;
  disabled?: boolean;
};

// Form control for attaching a receipt/proof image. Wraps the native picker
// (camera / library) and shows the staged file name; on edit it shows the
// existing attachment with Change (tap the chip) / Remove. Upload itself happens
// in the form's onSubmit so the object is only written on save.
export function ReceiptField({
  label,
  value,
  onChange,
  existing,
  removed,
  onRemovedChange,
  disabled = false,
}: Props) {
  const c = useTheme();
  const { t } = useTranslation('common');

  const showExisting = !value && !!existing && !removed;
  const fileName = value
    ? value.fileName
    : showExisting && existing
      ? fileNameFromPath(existing.storage_path)
      : null;

  function handleOutcome(outcome: PickOutcome) {
    if (outcome.ok) {
      onChange(outcome.asset);
      return;
    }
    if (outcome.reason === 'cancelled') return;
    Alert.alert(
      outcome.reason === 'permission'
        ? t('receiptPicker.permissionDenied')
        : outcome.reason === 'tooLarge'
          ? t('attachment.oversized', { size: 10 })
          : t('attachment.invalidType')
    );
  }

  async function openPicker(source: PickSource) {
    handleOutcome(await pickImage(source));
  }

  async function openDocument() {
    handleOutcome(await pickDocument());
  }

  function promptAttach() {
    if (disabled) return;
    const take = t('receiptPicker.takePhoto');
    const library = t('receiptPicker.chooseFromLibrary');
    const file = t('receiptPicker.chooseFile');
    const cancel = t('actions.cancel');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [take, library, file, cancel], cancelButtonIndex: 3 },
        (index) => {
          if (index === 0) void openPicker('camera');
          else if (index === 1) void openPicker('library');
          else if (index === 2) void openDocument();
        }
      );
    } else {
      Alert.alert(t('receiptPicker.chooseSource'), undefined, [
        { text: take, onPress: () => void openPicker('camera') },
        { text: library, onPress: () => void openPicker('library') },
        { text: file, onPress: () => void openDocument() },
        { text: cancel, style: 'cancel' },
      ]);
    }
  }

  function remove() {
    if (value) onChange(null);
    if (existing) onRemovedChange(true);
  }

  return (
    <View style={styles.field}>
      <FieldLabel>{label}</FieldLabel>

      {fileName ? (
        <View style={styles.attachedRow}>
          {/* Tap the chip to swap the file; the trailing ✕ clears it. */}
          <Pressable
            accessibilityRole='button'
            accessibilityLabel={t('receiptPicker.change')}
            disabled={disabled}
            onPress={promptAttach}
            style={({ pressed }) => [
              styles.chip,
              styles.chipFill,
              {
                borderColor: c.border,
                backgroundColor: c.muted,
                opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
              },
            ]}
          >
            <FileText size={16} color={c.mutedForeground} />
            <AppText
              variant='bodyMedium'
              numberOfLines={1}
              style={styles.chipName}
            >
              {fileName}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole='button'
            accessibilityLabel={t('receiptPicker.remove')}
            disabled={disabled}
            onPress={remove}
            hitSlop={8}
            style={({ pressed }) => [
              styles.removeButton,
              { backgroundColor: c.muted, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <X size={16} color={c.mutedForeground} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={t('receiptPicker.add')}
          disabled={disabled}
          onPress={promptAttach}
          style={({ pressed }) => [
            styles.addBox,
            {
              borderColor: c.border,
              backgroundColor: c.muted,
              opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <ImagePlus size={20} color={c.mutedForeground} />
          <AppText variant='bodyMedium' color='mutedForeground'>
            {t('receiptPicker.add')}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const CONTROL_HEIGHT = 50;

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  attachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: CONTROL_HEIGHT,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: Border.hairline,
  },
  chipFill: { flex: 1 },
  chipShrink: { flexShrink: 1 },
  chipName: { flexShrink: 1 },
  removeButton: {
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: CONTROL_HEIGHT,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: Border.hairline,
    borderStyle: 'dashed',
  },
  imageWrap: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: Border.hairline,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
});
