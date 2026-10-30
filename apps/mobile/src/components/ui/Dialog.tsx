import React, {useEffect, useRef} from 'react';
import {Animated, Modal, Pressable, View, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Surface} from '@/components/ui/Surface';
import {Text} from '@/components/ui/Text';
import {Button} from '@/components/ui/Button';
import {SCRIM_OPACITY} from '@/theme/elevation';

export type DialogAction = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'tonal' | 'destructive';
  disabled?: boolean;
};

export type DialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Message or custom content */
  children: React.ReactNode;
  /** Action buttons (up to 3 recommended) */
  actions?: DialogAction[];
  /** When false, backdrop press and Android back do not dismiss the dialog */
  dismissable?: boolean;
};

export function Dialog({
  visible,
  onClose,
  title,
  children,
  actions,
  dismissable = true,
}: DialogProps) {
  const {styles, theme} = useStyles(stylesheet);
  const {t} = useTranslation('common');
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const dialogScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: SCRIM_OPACITY,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(dialogScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 6,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dialogScale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scrimOpacity, dialogScale]);

  const handleClose = () => {
    if (dismissable) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={StyleSheet.absoluteFill}>
          {dismissable ? (
            <Pressable
              style={styles.scrimPressable}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t('dialog.closeAccessibilityLabel')}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.scrim,
                  {
                    opacity: scrimOpacity,
                    backgroundColor: theme.colors.scrim,
                  },
                ]}
              />
            </Pressable>
          ) : (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.scrim,
                StyleSheet.absoluteFill,
                {
                  opacity: scrimOpacity,
                  backgroundColor: theme.colors.scrim,
                },
              ]}
            />
          )}
        </View>

        <Pressable onPress={() => {}} style={styles.dialogContainer}>
          <Animated.View
            style={{
              transform: [{scale: dialogScale}],
            }}>
            <Surface variant="elevated" elevation={3} style={styles.dialog}>
              <Text variant="titleMedium" style={styles.title}>
                {title}
              </Text>
              <View style={styles.content}>
                {typeof children === 'string' ? (
                  <Text variant="bodyMedium" color="onSurfaceVariant">
                    {children}
                  </Text>
                ) : (
                  children
                )}
              </View>
              {actions && actions.length > 0 ? (
                <View style={styles.actions}>
                  {actions.map((action, index) => (
                    <Button
                      key={index}
                      label={action.label}
                      onPress={action.onPress}
                      variant={action.variant ?? 'tonal'}
                      disabled={action.disabled}
                    />
                  ))}
                </View>
              ) : null}
            </Surface>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

const stylesheet = createStyleSheet(theme => ({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  scrimPressable: {
    flex: 1,
  },
  scrim: {
    flex: 1,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
  },
  dialog: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    // Title styling inherited from Text component
  },
  content: {
    // Content spacing
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
}));
