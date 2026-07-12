import { ActionSheetIOS, Alert, Platform } from 'react-native';
import type { TFunction } from 'i18next';

import {
  pickImage,
  type PickedImage,
  type PickSource,
} from '@/lib/attachments';

// Scan chooser: same Take Photo / Choose from Library sheet as ReceiptField,
// but images only (the extraction model reads photos, not PDFs) and HEIC
// rejected explicitly — the camera/library re-encode to JPEG in practice, but
// a HEIC original from the library would likely be refused by the model.
export async function promptScanImage(
  t: TFunction
): Promise<PickedImage | null> {
  const source = await chooseSource(t);
  if (!source) return null;

  const outcome = await pickImage(source);
  if (!outcome.ok) {
    if (outcome.reason === 'cancelled') return null;
    Alert.alert(
      outcome.reason === 'permission'
        ? t('common:receiptPicker.permissionDenied')
        : outcome.reason === 'tooLarge'
          ? t('common:attachment.oversized', { size: 10 })
          : t('common:attachment.invalidType')
    );
    return null;
  }
  if (outcome.asset.mimeType === 'image/heic') {
    Alert.alert(t('common:attachment.invalidType'));
    return null;
  }
  return outcome.asset;
}

function chooseSource(t: TFunction): Promise<PickSource | null> {
  const take = t('common:receiptPicker.takePhoto');
  const library = t('common:receiptPicker.chooseFromLibrary');
  const cancel = t('common:actions.cancel');

  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [take, library, cancel], cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) resolve('camera');
          else if (index === 1) resolve('library');
          else resolve(null);
        }
      );
    } else {
      Alert.alert(t('common:receiptPicker.chooseSource'), undefined, [
        { text: take, onPress: () => resolve('camera') },
        { text: library, onPress: () => resolve('library') },
        { text: cancel, style: 'cancel', onPress: () => resolve(null) },
      ]);
    }
  });
}
