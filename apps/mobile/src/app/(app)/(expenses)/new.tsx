import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { clampScanDate } from '@rinciku/domain/ai-chat';

import { AppText, Button, Notice } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useScanExtraction } from '@/hooks/use-scan-extraction';
import { useTheme } from '@/hooks/use-theme';

// New-expense modal, launched from the Expenses header "+" (blank) or its Scan
// button (`?scan=1`: the photo stashed in pending-scan is analyzed here and the
// form opens prefilled for review). Keyboard-aware so lower fields aren't
// hidden behind the keyboard.
export default function NewExpenseScreen() {
  const c = useTheme();
  const router = useRouter();
  const { t } = useTranslation('expenses');
  const { scan } = useLocalSearchParams<{ scan?: string }>();
  const { asset, status, proposal, matchedId, retry } = useScanExtraction(
    'expense',
    scan === '1'
  );

  // The form mounts only after the scan settles so react-hook-form sees the
  // extracted defaultValues at mount (no reset plumbing needed).
  if (status === 'analyzing') {
    return (
      <View style={[styles.analyzing, { backgroundColor: c.background }]}>
        {asset ? (
          <Image
            source={{ uri: asset.uri }}
            style={[styles.thumb, { backgroundColor: c.muted }]}
            contentFit='cover'
          />
        ) : null}
        <ActivityIndicator color={c.mutedForeground} />
        <AppText variant='bodyMedium'>{t('common:scan.analyzing')}</AppText>
        <AppText variant='caption' color='mutedForeground'>
          {t('common:scan.analyzingHint')}
        </AppText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.content}
      >
        {status === 'failed' ? (
          <View style={styles.scanFailed}>
            <Notice tone='error'>{t('common:scan.failed')}</Notice>
            <Button
              label={t('common:scan.retry')}
              variant='outline'
              onPress={() => void retry()}
            />
          </View>
        ) : (
          <AppText
            variant='caption'
            color='mutedForeground'
            style={styles.intro}
          >
            {status === 'done'
              ? t('common:scan.prefilled')
              : t('page.createDescription')}
          </AppText>
        )}
        <ExpenseForm
          mode='create'
          defaultValues={
            proposal
              ? {
                  amount: proposal.amount,
                  currency: proposal.currency,
                  category_id: matchedId ?? undefined,
                  occurred_at: clampScanDate(proposal.occurred_at),
                  note: proposal.note ?? undefined,
                }
              : undefined
          }
          initialReceipt={asset}
          extraction={
            proposal
              ? {
                  raw: proposal.raw,
                  confidence: proposal.confidence,
                  docType: proposal.doc_type,
                }
              : null
          }
          onSuccess={() => router.back()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.four, paddingBottom: Spacing.six },
  intro: { marginBottom: Spacing.four },
  scanFailed: { gap: Spacing.three, marginBottom: Spacing.four },
  analyzing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  thumb: { width: 120, height: 160, borderRadius: Radius.md },
});
