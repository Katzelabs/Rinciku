import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NotFoundScreen() {
  const c = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.title, { color: c.foreground }]}>
          This screen doesn&apos;t exist.
        </Text>
        <Link href='/'>
          <Text style={[styles.link, { color: c.foreground }]}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  title: { fontFamily: Fonts.semibold, fontSize: 18 },
  link: { fontFamily: Fonts.semibold, fontSize: 16 },
});
