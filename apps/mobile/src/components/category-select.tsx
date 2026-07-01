import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, X } from 'lucide-react-native';
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { listCategories, listTiers } from '@/features/categories/api';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { groupByTier, type Tier, type TierGroup } from '@/features/categories/types';
import { InputShell } from '@/features/auth/components/text-field';
import { Notice } from '@/features/auth/components/notice';
import { useTheme } from '@/hooks/use-theme';

type Category = Tables<'categories'>;

interface CategorySelectProps {
  /** Selected category id, or null when nothing is picked. */
  value: string | null;
  onChange: (id: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Single-select category picker grouped by tier. Fetches the taxonomy from the
// shared domain api and opens a page-sheet list. Shared by the expenses and
// essentials forms — the tier-grouped visual mirrors the web category Select.
export function CategorySelect({
  value,
  onChange,
  invalid,
  disabled,
  placeholder,
}: CategorySelectProps) {
  const c = useTheme();
  const { t } = useTranslation('categories');
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{
    categories: Category[];
    tiers: Tier[];
    error: string | null;
  } | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listTiers()]).then(([cats, tiers]) => {
      if (cancelled) return;
      setData({
        categories: cats.data ?? [],
        tiers: tiers.data ?? [],
        error: cats.error?.message ?? tiers.error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = data === null;
  const selected = data?.categories.find((cat) => cat.id === value) ?? null;
  const groups: TierGroup[] = data
    ? groupByTier(data.categories, data.tiers)
    : [];

  return (
    <>
      <Pressable
        accessibilityRole='button'
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <InputShell invalid={invalid}>
          <View style={styles.trigger}>
            {selected ? (
              <>
                <CategoryIcon
                  name={selected.icon}
                  size={18}
                  color={selected.color ?? c.foreground}
                />
                <Text style={[styles.triggerText, { color: c.foreground }]}>
                  {selected.name}
                </Text>
              </>
            ) : (
              <Text
                style={[styles.triggerText, { color: c.mutedForeground }]}
              >
                {placeholder ?? t('tier.selectCategory', 'Pick a category')}
              </Text>
            )}
          </View>
          <ChevronDown size={18} color={c.mutedForeground} />
        </InputShell>
      </Pressable>

      <Modal
        visible={open}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.sheet, { backgroundColor: c.background }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: c.foreground }]}>
              {placeholder ?? t('tier.selectCategory', 'Pick a category')}
            </Text>
            <Pressable
              hitSlop={8}
              accessibilityRole='button'
              accessibilityLabel={t('common:actions.close')}
              onPress={() => setOpen(false)}
            >
              <X size={22} color={c.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.sheetBody,
              { paddingBottom: insets.bottom + Spacing.five },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={c.primary} style={styles.loader} />
            ) : data?.error ? (
              <Notice tone='error'>{data.error}</Notice>
            ) : (
              groups.map((group) =>
                group.categories.length === 0 ? null : (
                  <View
                    key={group.tier?.id ?? '__untiered__'}
                    style={styles.group}
                  >
                    <Text
                      style={[styles.groupLabel, { color: c.mutedForeground }]}
                    >
                      {group.tier ? group.tier.name : t('tier.untiered')}
                    </Text>
                    {group.categories.map((cat, i) => {
                      const isSelected = cat.id === value;
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => {
                            onChange(cat.id);
                            setOpen(false);
                          }}
                          style={[
                            styles.option,
                            i > 0 && {
                              borderTopColor: c.border,
                              borderTopWidth: StyleSheet.hairlineWidth,
                            },
                            isSelected && { backgroundColor: c.muted },
                          ]}
                        >
                          <View
                            style={[
                              styles.iconBadge,
                              { backgroundColor: `${cat.color ?? '#8d8d8d'}22` },
                            ]}
                          >
                            <CategoryIcon
                              name={cat.icon}
                              size={16}
                              color={cat.color ?? c.foreground}
                            />
                          </View>
                          <Text
                            style={[styles.optionText, { color: c.foreground }]}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )
              )
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  triggerText: { fontFamily: Fonts.regular, fontSize: 16 },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20 },
  sheetBody: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  loader: { marginVertical: Spacing.four },
  group: { gap: Spacing.one },
  groupLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.lg,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
});
