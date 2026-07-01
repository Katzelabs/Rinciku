import { Pressable, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';

interface HeaderAddButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
}

// A header-right "+" action shared by the Expenses, Essentials and Categories
// screens. Uses the lucide Plus to match the managers' inline add buttons.
export function HeaderAddButton({
  onPress,
  accessibilityLabel,
}: HeaderAddButtonProps) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
    >
      <Plus size={24} color={c.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
});
