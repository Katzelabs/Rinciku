import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Type, type TypeVariant, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface AppTextProps extends RNTextProps {
  /** Type-scale variant (see `Type` in theme.ts). Defaults to `body`. */
  variant?: TypeVariant;
  /** Theme color token for the text. Defaults to `foreground`. */
  color?: ThemeColor;
}

/**
 * The single text primitive. Replaces the ~49 hand-paired
 * `fontFamily: Fonts.* + fontSize` StyleSheets — pick a `variant` from the type
 * scale and a `color` token instead. Extra RN Text props (numberOfLines,
 * adjustsFontSizeToFit, style overrides…) pass straight through.
 */
export function AppText({
  variant = 'body',
  color = 'foreground',
  style,
  ...rest
}: AppTextProps) {
  const c = useTheme();
  return <RNText style={[Type[variant], { color: c[color] }, style]} {...rest} />;
}
