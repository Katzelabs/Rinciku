import { useEffect, useState } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { AuthScreenShell } from '@/features/auth/components/auth-screen-shell';
import { Notice } from '@/features/auth/components/notice';
import { TextLink } from '@/features/auth/components/text-link';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';

// Landing route for the signup confirmation deep link (token_hash flow). On
// success the session is established and the root guard routes the new user to
// onboarding; on failure we show recovery links.
export default function AuthCallbackScreen() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const router = useRouter();
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function confirm() {
      const tokenHash = params.token_hash;
      const type = params.type as EmailOtpType | undefined;
      if (!tokenHash || !type) {
        setFailed(true);
        return;
      }
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!active) return;
      if (error) {
        setFailed(true);
        return;
      }
      router.replace('/');
    }

    confirm();
    return () => {
      active = false;
    };
  }, [params.token_hash, params.type, router]);

  if (!failed) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  return (
    <AuthScreenShell
      badge='exclamationmark.triangle.fill'
      title={t('authCallback.title')}
      footer={
        <View style={styles.footerRow}>
          <TextLink href='/sign-in'>{t('authCallback.signIn')}</TextLink>
          <TextLink href='/sign-up'>{t('authCallback.signUp')}</TextLink>
        </View>
      }
    >
      <Notice tone='error'>{t('authCallback.description')}</Notice>
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
});
