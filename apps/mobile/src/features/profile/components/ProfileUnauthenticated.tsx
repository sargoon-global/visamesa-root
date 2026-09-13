import React from 'react';
import {View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {BrandLogo} from '@/components/brand/BrandLogo';
import {Button} from '@/components/ui/Button';
import {Surface} from '@/components/ui/Surface';
import {Text} from '@/components/ui/Text';

type ProfileUnauthenticatedProps = {
  onSignInPress: () => void;
  onSupportPress: () => void;
};

export function ProfileUnauthenticated({
  onSignInPress,
  onSupportPress,
}: ProfileUnauthenticatedProps) {
  const {styles} = useStyles(stylesheet);
  const {t} = useTranslation(['auth', 'common', 'support']);

  return (
    <View style={styles.container}>
      <Surface variant="elevated" elevation={2} style={styles.card}>
        <View style={styles.logoWrap}>
          <BrandLogo
            size="hero"
            layout="vertical"
            accessibilityLabel={t('common:brand')}
          />
        </View>
        <Text variant="bodyMedium" color="onSurfaceVariant" style={styles.subtitle}>
          {t('auth:welcomeSubtitle')}
        </Text>
        <Button
          label={t('common:actions.signIn')}
          onPress={onSignInPress}
          fullWidth
        />
        <Button
          label={t('support:profileRowTitle')}
          onPress={onSupportPress}
          variant="outline"
          fullWidth
        />
      </Surface>
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
    maxWidth: theme.sizes.contentMaxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
  },
}));
