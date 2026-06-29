import { Link, type Href } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Inline navigational link styled in the brand primary color. Wraps expo-router
// Link so footers read `<TextLink href="/sign-up">Sign up</TextLink>`.
export function TextLink({
  href,
  children,
  replace,
}: {
  href: Href;
  children: string;
  replace?: boolean;
}) {
  const c = useTheme();
  return (
    <Link href={href} replace={replace} style={styles.link}>
      <Text style={[styles.text, { color: c.foreground }]}>{children}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {},
  text: { fontFamily: Fonts.semibold, fontSize: 14 },
});
