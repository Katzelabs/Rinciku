import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';

import { formatDate } from '@rinciku/core';

import { Fonts, Spacing } from '@/constants/theme';
import { InputShell } from '@/features/auth/components/text-field';
import { useTheme } from '@/hooks/use-theme';

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
  invalid?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

// Date picker field. iOS renders the native compact picker inline (its own
// tappable control); Android shows the formatted date and opens a dialog picker
// on tap. Uses core's locale-aware `formatDate` for the Android label so it
// follows the active language.
export function DateField({
  value,
  onChange,
  invalid,
  maximumDate,
  minimumDate,
}: DateFieldProps) {
  const c = useTheme();
  const [open, setOpen] = useState(false);

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.iosWrap}>
        <DateTimePicker
          value={value}
          mode='date'
          display='compact'
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          accentColor={c.primary}
          onValueChange={(_event, date) => onChange(date)}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole='button'>
        <InputShell invalid={invalid}>
          <Text style={[styles.text, { color: c.foreground }]}>
            {formatDate(value, 'PP')}
          </Text>
        </InputShell>
      </Pressable>
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

const styles = StyleSheet.create({
  iosWrap: { alignItems: 'flex-start' },
  text: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
