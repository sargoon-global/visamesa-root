import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Text} from '@/components/ui/Text';
import {
  getFormControlContainerStyle,
  getFormControlTextInputStyle,
} from '@/components/ui/formControlStyles';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  helperText?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  helperText,
  error,
  containerStyle,
  editable = true,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const {styles, theme} = useStyles(stylesheet);
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="labelMedium" style={styles.label}>
        {label}
      </Text>
      {helperText ? (
        <Text variant="bodySmall" color="onSurfaceVariant" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
      <View
        style={getFormControlContainerStyle(theme, {
          focused: isFocused,
          error: Boolean(error),
          disabled: !editable,
        })}>
        <TextInput
          {...props}
          editable={editable}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={getFormControlTextInputStyle(theme)}
        />
      </View>
      <View style={styles.errorSlot}>
        {error ? (
          <Text variant="bodySmall" color="error" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.onSurfaceVariant,
  },
  helper: {
    marginTop: -theme.spacing.xs / 2,
  },
  error: {
    marginTop: 0,
  },
  errorSlot: {
    minHeight: theme.typography.bodySmall.lineHeight,
  },
}));
