import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Button, Card, InputShell, Sheet } from '@/components/ui';
import { SwipeRow } from '@/components/swipe-row';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Conversation } from '@/features/ai-chat/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[] | undefined;
  isLoading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
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
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / MS_PER_DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 7) return 'previous7Days';
  if (days <= 30) return 'previous30Days';
  return 'older';
}

function groupConversations(items: Conversation[]) {
  const map = new Map<GroupLabel, Conversation[]>();
  for (const c of items) {
    const key = bucketFor(c.last_message_at ?? c.created_at);
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  }
  return GROUP_ORDER.filter((g) => map.has(g)).map((label) => ({
    label,
    items: map.get(label)!,
  }));
}

// The conversation-history sheet: date-grouped rows with tap-to-open,
// swipe-to-delete, and long-press-to-rename (no inline pencil/trash buttons, per
// the mobile list-row pattern). Delete confirmation is the screen's job (Alert);
// rename is an in-sheet form here. Data/sorting come from the shared brain.
export function ConversationList({
  visible,
  onClose,
  conversations,
  isLoading,
  activeId,
  onSelect,
  onRename,
  onDelete,
}: Props) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');

  function startRename(conversation: Conversation) {
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

  const groups =
    conversations && conversations.length > 0
      ? groupConversations(conversations)
      : [];

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
      ) : groups.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps='handled'
        >
          {groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <AppText
                variant='overline'
                color='mutedForeground'
                style={styles.groupLabel}
              >
                {t(`list.groups.${group.label}`)}
              </AppText>
              <Card padding={0} style={styles.card}>
                {group.items.map((conversation, i) => {
                  const isActive = conversation.id === activeId;
                  return (
                    <SwipeRow
                      key={conversation.id}
                      topBorder={i > 0}
                      deleteLabel={t('common:actions.delete')}
                      onPress={() => onSelect(conversation.id)}
                      onLongPress={() => startRename(conversation)}
                      onDelete={() => onDelete(conversation.id)}
                    >
                      <AppText
                        variant={isActive ? 'bodyMedium' : 'body'}
                        color={isActive ? 'primary' : 'foreground'}
                        numberOfLines={1}
                        style={styles.rowText}
                      >
                        {conversation.title?.trim() || t('header.untitled')}
                      </AppText>
                    </SwipeRow>
                  );
                })}
              </Card>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <AppText variant='label' color='mutedForeground'>
            {t('list.empty')}
          </AppText>
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
  scrollBody: { gap: Spacing.four, paddingBottom: Spacing.six },
  group: { gap: Spacing.two },
  groupLabel: { paddingHorizontal: Spacing.one },
  // overflow hidden so a swiped row's red delete action is clipped to the card's
  // rounded corners; rows own their horizontal padding (SwipeRow).
  card: { overflow: 'hidden' },
  rowText: { flex: 1 },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
});
