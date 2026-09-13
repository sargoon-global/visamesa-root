import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createStyleSheet, useStyles} from 'react-native-unistyles';
import {useTranslation} from 'react-i18next';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {DetailLinkRow} from '@/components/ui/DetailLinkRow';
import {Text} from '@/components/ui/Text';
import {PaymentAlreadyPaidDialog} from '@/features/profile/components/PaymentAlreadyPaidDialog';
import {ProfileActions} from '@/features/profile/components/ProfileActions';
import {ProfileHeader} from '@/features/profile/components/ProfileHeader';
import {ProfileUnauthenticated} from '@/features/profile/components/ProfileUnauthenticated';
import {useProfileScreen} from '@/features/profile/hooks/useProfileScreen';
import {ProfileStackParamList} from '@/navigation/types';
import {useTabBarInset} from '@/navigation/useTabBarInset';

type ProfileScreenNavigation = NativeStackNavigationProp<
  ProfileStackParamList,
  'Profile'
>;

type ProfileScreenProps = {
  navigation: ProfileScreenNavigation;
};

const ProfileScreen = ({navigation}: ProfileScreenProps) => {
  const {styles, theme} = useStyles(stylesheet);
  const {t} = useTranslation('profile');
  const {t: tSupport} = useTranslation('support');
  const tabBarInset = useTabBarInset();
  const {
    isAuthLoading,
    userEmail,
    isStatusLoading,
    profileError,
    profileCompleteness,
    onSectionPress,
    onSignInPress,
    onSignOutPress,
    onPaymentPress,
    showAlreadyPaidDialog,
    onDismissAlreadyPaidDialog,
    onSeePaymentStatus,
  } = useProfileScreen(navigation);

  const handleLegalPress = () => {
    navigation.navigate('Legal');
  };

  const handleSupportPress = () => {
    navigation.navigate('Support');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  if (isAuthLoading || (userEmail && isStatusLoading)) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userEmail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ProfileUnauthenticated
          onSignInPress={onSignInPress}
          onSupportPress={handleSupportPress}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ProfileHeader />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: theme.spacing.md + tabBarInset},
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {profileError ? (
            <Text variant="bodyMedium" color="error" style={styles.error}>
              {profileError.message}
            </Text>
          ) : null}

          <DetailLinkRow
            title={t('personalTitle')}
            description={t('personalDescription')}
            onPress={() => onSectionPress('personal')}
            status={profileCompleteness.personalInformation ? 'done' : 'notDone'}
          />

          <DetailLinkRow
            title={t('legalTitle')}
            description={t('legalDescription')}
            onPress={handleLegalPress}
            status={profileCompleteness.legalPrivacy ? 'done' : 'notDone'}
          />

          <DetailLinkRow
            title={t('paymentTitle')}
            description={t('paymentDescription')}
            onPress={onPaymentPress}
            status={profileCompleteness.payment ? 'done' : 'notDone'}
          />

          <DetailLinkRow
            title={tSupport('profileRowTitle')}
            description={tSupport('profileRowDescription')}
            icon="help"
            onPress={handleSupportPress}
          />

          <DetailLinkRow
            title={t('settingsTitle')}
            description={t('settingsDescription')}
            icon="settings"
            onPress={handleSettingsPress}
          />

          <ProfileActions onSignOutPress={onSignOutPress} />
        </ScrollView>
      </KeyboardAvoidingView>
      <PaymentAlreadyPaidDialog
        visible={showAlreadyPaidDialog}
        onClose={onDismissAlreadyPaidDialog}
        onSeeStatus={onSeePaymentStatus}
      />
    </SafeAreaView>
  );
};

const stylesheet = createStyleSheet(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    textAlign: 'center',
  },
}));

export default ProfileScreen;
