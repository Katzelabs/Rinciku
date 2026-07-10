import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Calendar, ChevronDown } from 'lucide-react-native';

import { formatDate } from '@rinciku/core';

import { AppText } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { InputShell } from '@/features/auth/components/text-field';
import { useTheme } from '@/hooks/use-theme';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  invalid?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

// Date picker field. Renders as a full-width tappable pill (leading calendar
// icon + locale-formatted date) so it lines up with the other form inputs and
// the CategorySelect trigger. Tapping opens the native picker: iOS shows a
// bottom-sheet graphical calendar (the @expo/ui inline picker only sizes to its
// container, so a full-width sheet — not the field's own column — keeps it from
// collapsing/cramping), Android opens the native dialog picker.
export function DateField({
  value,
  onChange,
  invalid,
  maximumDate,
  minimumDate,
}: DateFieldProps) {
  const c = useTheme();
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const trigger = (
    <Pressable
      onPress={() => setOpen(true)}
      accessibilityRole='button'
      accessibilityLabel={formatDate(value, 'PP')}
    >
      <InputShell
        invalid={invalid}
        focused={open}
        leading={<Calendar size={18} color={c.mutedForeground} />}
      >
        <Text style={[styles.text, { color: c.foreground }]}>
          {formatDate(value, 'PP')}
        </Text>
        <ChevronDown size={18} color={c.mutedForeground} />
      </InputShell>
    </Pressable>
  );

  // Android: native dialog picker mounted while open.
  if (Platform.OS !== 'ios') {
    return (
      <>
        {trigger}
        {open ? (
          <DateTimePicker
            value={value}
            mode='date'
            presentation='dialog'
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            accentColor={c.primary}
            onValueChange={(_event, date) => {
              onChange(date);
              setOpen(false);
            }}
            onDismiss={() => setOpen(false)}
          />
        ) : null}
      </>
    );
  }

  // iOS: full-width graphical calendar in a bottom sheet.
  return (
    <>
      {trigger}
      <Modal
        visible={open}
        transparent
        animationType='slide'
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            accessibilityRole='button'
            accessibilityLabel={t('actions.close')}
            onPress={() => setOpen(false)}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: c.card,
                borderColor: c.border,
                paddingBottom: insets.bottom + Spacing.three,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={[styles.grabber, { backgroundColor: c.border }]} />
              <Pressable
                hitSlop={8}
                accessibilityRole='button'
                onPress={() => setOpen(false)}
                style={styles.doneButton}
              >
                <AppText variant='bodyMedium' color='primary'>
                  {t('actions.done')}
                </AppText>
              </Pressable>
            </View>
            <DateTimePicker
              value={value}
              mode='date'
              display='inline'
              style={styles.calendar}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              accentColor={c.primary}
              onValueChange={(_event, date) => onChange(date)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  text: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  sheetHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.one,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.two,
  },
  doneButton: { position: 'absolute', right: 0, top: Spacing.one },
  calendar: { width: '100%' },
});
