import React, {useCallback, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {CollapsingHeaderScreen} from '@/components/layout/CollapsingHeaderScreen';
import {DynamicForm} from '@/features/forms/components/DynamicForm';
import {ConsentDialog} from '@/features/profile/components/ConsentDialog';
import {StepInvalidationDialog} from '@/features/profile/components/StepInvalidationDialog';
import {EmpadronamientoValidityWatcher} from '@/features/profile/components/EmpadronamientoValidityWatcher';
import {useProfileData} from '@/features/profile/context/ProfileDataContext';
import {useFormSchema} from '@/features/forms/hooks/useFormSchema';
import {PROFILE_PERSONAL_FORM_ID} from '@/features/profile/data/profileSections';
import {useProfileSectionScreen} from '@/features/profile/hooks/useProfileSectionScreen';
import {Text} from '@/components/ui/Text';
import {ProfileStackParamList} from '@/navigation/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';

type ProfileSectionScreenProps = {
  route: RouteProp<ProfileStackParamList, 'ProfileSection'>;
};

type ProfileSectionNavigation = NativeStackNavigationProp<
  ProfileStackParamList,
  'ProfileSection'
>;

const ProfileSectionScreen = ({route}: ProfileSectionScreenProps) => {
  const {styles, theme} = useStyles(stylesheet);
  const navigation = useNavigation<ProfileSectionNavigation>();
  const {
    title,
    formId,
    initialValues,
    isSubmitting,
    isProfileLocked,
    showConsentDialog,
    stepInvalidationDialog,
    onSubmit,
    onConsentAccept,
    onConsentDecline,
  } = useProfileSectionScreen(route, navigation);
  const {t} = useTranslation('profile');
  const {error: profileLoadError} = useProfileData();
  const {schema, isLoading, error} = useFormSchema(formId);
  const showPersonalLoadError =
    route.params.sectionId === 'personal' && profileLoadError;
  const [formResetKey, setFormResetKey] = useState(0);

  const handleCancelStepInvalidation = useCallback(() => {
    stepInvalidationDialog.onCancel();
    setFormResetKey(key => key + 1);
  }, [stepInvalidationDialog]);

  return (
    <CollapsingHeaderScreen title={title} keyboardAvoiding>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <Text variant="bodyMedium" color="error" style={styles.error}>
          {error.message}
        </Text>
      ) : schema ? (
        <>
          {showPersonalLoadError ? (
            <Text variant="bodyMedium" color="error" style={styles.error}>
              {profileLoadError.message}
            </Text>
          ) : null}
          {isProfileLocked ? (
            <Text variant="bodyMedium" color="onSurfaceVariant">
              {t('lockedNotice')}
            </Text>
          ) : null}
          <DynamicForm
            key={`${formId}-${formResetKey}`}
            schema={schema}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            initialValues={initialValues}
            disabled={isProfileLocked}
          >
            {!isProfileLocked && formId === PROFILE_PERSONAL_FORM_ID ? (
              <EmpadronamientoValidityWatcher />
            ) : null}
          </DynamicForm>
          {stepInvalidationDialog.visible ? (
            <StepInvalidationDialog
              steps={stepInvalidationDialog.steps}
              isConfirming={
                stepInvalidationDialog.isConfirming || isSubmitting
              }
              onConfirm={stepInvalidationDialog.onConfirm}
              onCancel={handleCancelStepInvalidation}
            />
          ) : null}
          {showConsentDialog ? (
            <ConsentDialog
              onAccept={onConsentAccept}
              onDecline={onConsentDecline}
            />
          ) : null}
        </>
      ) : null}
    </CollapsingHeaderScreen>
  );
};

const stylesheet = createStyleSheet(theme => ({
  centered: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  error: {
    textAlign: 'center',
  },
}));

export default ProfileSectionScreen;
