import { LegendList } from '@legendapp/list/react-native';
import { formatRelativeTime } from '@rinciku/core';
import { MessagesSquare } from '@/lib/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, InputShell, Sheet } from '@/components/ui';
import { EmptyState } from '@/components/empty-state';
import { SwipeRow } from '@/components/swipe-row';
import { Border, CardStyle, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ConversationListItem } from '@/features/ai-chat/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  conversations: ConversationListItem[] | undefined;
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  // Infinite scroll over the paginated list.
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

// Stable group keys (ordered); display labels resolve via t('list.groups.<key>').
const GROUP_ORDER = [
  'today',
  'yesterday',
  'previous7Days',
  'previous30Days',
  'older',
] as const;

type GroupLabel = (typeof GROUP_ORDER)[number];

const MS_PER_DAY = 86_400_000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Plain-Date bucketing (date-fns isn't a mobile dependency — it lives in
// packages/core|domain only). Mirrors the web bucketFor: calendar-day distance.
function bucketFor(value: string | null): GroupLabel {
  if (!value) return 'older';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'older';
  const days = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / MS_PER_DAY
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 7) return 'previous7Days';
  if (days <= 30) return 'previous30Days';
  return 'older';
}

// One flat row per group header / conversation so a single LegendList can
// render the date-grouped sheet. Item rows carry the card-slice flags computed
// at flatten time: the grouped-Card look survives without a wrapping <Card>
// (each row paints the card background; first/last rows round their corners).
type Row =
  | { kind: 'header'; label: GroupLabel; key: string }
  | {
      kind: 'item';
      c: ConversationListItem;
      key: string;
      topBorder: boolean;
      roundTop: boolean;
      roundBottom: boolean;
    };

function flattenToRows(items: ConversationListItem[]): Row[] {
  const map = new Map<GroupLabel, ConversationListItem[]>();
  for (const c of items) {
    const key = bucketFor(c.last_message_at ?? c.created_at);
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  }
  const rows: Row[] = [];
  for (const label of GROUP_ORDER) {
    const group = map.get(label);
    if (!group) continue;
    rows.push({ kind: 'header', label, key: `header-${label}` });
    group.forEach((c, i) => {
      rows.push({
        kind: 'item',
        c,
        key: c.id,
        topBorder: i > 0,
        roundTop: i === 0,
        roundBottom: i === group.length - 1,
      });
    });
  }
  return rows;
}

const keyExtractor = (row: Row) => row.key;

// The conversation-history sheet: date-grouped rows with tap-to-open,
// swipe-to-delete, and long-press-to-rename (no inline pencil/trash buttons, per
// the mobile list-row pattern). Delete confirmation is the screen's job (Alert);
// rename is an in-sheet form here. Virtualized (LegendList over flattened
// header+item rows) with bottom-reach pagination.
export function ConversationList({
  visible,
  onClose,
  conversations,
  isLoading,
  activeId,
  onSelect,
  onRename,
  onDelete,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}: Props) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const [renameTarget, setRenameTarget] = useState<ConversationListItem | null>(
    null
  );
  const [draft, setDraft] = useState('');

  function startRename(conversation: ConversationListItem) {
    setDraft(conversation.title?.trim() || t('header.untitled'));
    setRenameTarget(conversation);
  }

  function commitRename() {
    const target = renameTarget;
    if (!target) return;
    const title = draft.trim();
    setRenameTarget(null);
    if (title && title !== (target.title?.trim() ?? '')) {
      onRename(target.id, title);
    }
  }

  const rows =
    conversations && conversations.length > 0
      ? flattenToRows(conversations)
      : [];

  function renderRow({ item: row }: { item: Row }) {
    if (row.kind === 'header') {
      return (
        <AppText
          variant='overline'
          color='mutedForeground'
          style={styles.groupLabel}
        >
          {t(`list.groups.${row.label}`)}
        </AppText>
      );
    }
    const conversation = row.c;
    const isActive = conversation.id === activeId;
    const preview = conversation.last_message_preview?.trim();
    return (
      <View
        // A slice of the old grouped Card: card background + side hairlines on
        // every row, top/bottom edge + corner rounding only on the group's
        // first/last row. overflow hidden clips the swipe delete action to the
        // rounded corners exactly like the Card wrapper did.
        style={[
          styles.cardSlice,
          {
            backgroundColor: c.card,
            borderColor: c.border,
            borderTopWidth: row.roundTop ? CardStyle.borderWidth : 0,
            borderBottomWidth: row.roundBottom ? CardStyle.borderWidth : 0,
            borderTopLeftRadius: row.roundTop ? CardStyle.radius : 0,
            borderTopRightRadius: row.roundTop ? CardStyle.radius : 0,
            borderBottomLeftRadius: row.roundBottom ? CardStyle.radius : 0,
            borderBottomRightRadius: row.roundBottom ? CardStyle.radius : 0,
          },
        ]}
      >
        <SwipeRow
          topBorder={row.topBorder}
          deleteLabel={t('common:actions.delete')}
          onPress={() => onSelect(conversation.id)}
          onLongPress={() => startRename(conversation)}
          onDelete={() => onDelete(conversation.id)}
        >
          <View style={styles.rowMain}>
            <AppText
              variant={isActive ? 'bodyMedium' : 'body'}
              color={isActive ? 'primary' : 'foreground'}
              numberOfLines={1}
            >
              {conversation.title?.trim() || t('header.untitled')}
            </AppText>
            {preview ? (
              <AppText
                variant='caption'
                color='mutedForeground'
                numberOfLines={1}
              >
                {preview}
              </AppText>
            ) : null}
          </View>
          <AppText
            variant='caption'
            color='mutedForeground'
            style={styles.rowTime}
          >
            {formatRelativeTime(
              conversation.last_message_at ?? conversation.created_at
            )}
          </AppText>
        </SwipeRow>
      </View>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('list.title')}
      scroll={false}
    >
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : rows.length > 0 ? (
        <LegendList
          data={rows}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          estimatedItemSize={60}
          recycleItems={false}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listBody}
          onEndReached={hasNextPage ? onLoadMore : undefined}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.moreSpinner}>
                <ActivityIndicator color={c.mutedForeground} />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.center}>
          <EmptyState
            icon={MessagesSquare}
            title={t('list.empty')}
            subtitle={t('list.emptyHint')}
          />
        </View>
      )}

      <Sheet
        visible={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        title={t('rename.title')}
      >
        <AppText variant='caption' color='mutedForeground'>
          {t('rename.description')}
        </AppText>
        <InputShell>
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            placeholder={t('rename.placeholder')}
            placeholderTextColor={c.mutedForeground}
            returnKeyType='done'
            onSubmitEditing={commitRename}
            style={[styles.input, { color: c.foreground }]}
          />
        </InputShell>
        <Button label={t('header.save')} onPress={commitRename} />
      </Sheet>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  listBody: { paddingBottom: Spacing.six },
  groupLabel: {
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  cardSlice: {
    borderLeftWidth: Border.hairline,
    borderRightWidth: Border.hairline,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  // Title + one-line preview stack; the relative timestamp sits to the right and
  // keeps its natural width so long titles/previews truncate instead of it.
  rowMain: { flex: 1, gap: 2 },
  rowTime: { flexShrink: 0 },
  moreSpinner: { paddingVertical: Spacing.four, alignItems: 'center' },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
