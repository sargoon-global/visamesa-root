import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  View,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Text} from '@/components/ui/Text';
import {useBottomSheetGesture} from '@/hooks/useBottomSheetGesture';
import {SCRIM_OPACITY} from '@/theme/elevation';

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Optional footer (e.g., action buttons) */
  footer?: React.ReactNode;
  /** Maximum height as fraction of screen (0-1) */
  maxHeightFraction?: number;
};

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  maxHeightFraction = 0.9,
}: BottomSheetProps) {
  const {styles, theme} = useStyles(stylesheet);
  const {t} = useTranslation('common');
  const insets = useSafeAreaInsets();
  const offScreenOffset = Dimensions.get('window').height;
  const scrimOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  
  const {panResponder, translateY, setSheetHeight} = useBottomSheetGesture({
    onClose,
  });

  useEffect(() => {
    if (visible) {
      sheetTranslateY.setValue(offScreenOffset);
      translateY.setValue(0);
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: SCRIM_OPACITY,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(scrimOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: offScreenOffset,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [offScreenOffset, visible, scrimOpacity, sheetTranslateY, translateY]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const {height} = event.nativeEvent.layout;
    setSheetHeight(height);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          style={styles.scrimPressable}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close">
          <Animated.View
            style={[
              styles.scrim,
              {
                opacity: scrimOpacity,
                backgroundColor: theme.colors.scrim,
              },
            ]}
          />
        </Pressable>
      </View>
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            transform: [
              {translateY: sheetTranslateY},
              {translateY: translateY},
            ],
            maxHeight: `${maxHeightFraction * 100}%`,
          },
        ]}
        onLayout={handleLayout}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radii.xl,
              borderTopRightRadius: theme.radii.xl,
              paddingBottom: Math.max(insets.bottom, theme.spacing.md),
            },
          ]}>
          <View
            style={styles.grabberContainer}
            accessibilityRole="adjustable"
            accessibilityLabel={t('bottomSheet.dragToClose')}
            {...panResponder.panHandlers}>
            <View
              style={[
                styles.grabber,
                {backgroundColor: theme.colors.outlineVariant},
              ]}
            />
          </View>
          {title ? (
            <View style={styles.header}>
              <Text variant="titleMedium">{title}</Text>
            </View>
          ) : null}
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </Animated.View>
    </Modal>
  );
}

const stylesheet = createStyleSheet(theme => ({
  scrimPressable: {
    flex: 1,
  },
  scrim: {
    flex: 1,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    width: '100%',
  },
  grabberContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  grabber: {
    width: 32,
    height: 4,
    borderRadius: theme.radii.full,
  },
  header: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingBottom: theme.spacing.sm,
  },
  content: {
    paddingHorizontal: theme.layout.screenPaddingX,
  },
  footer: {
    paddingHorizontal: theme.layout.screenPaddingX,
    paddingTop: theme.spacing.md,
  },
}));
