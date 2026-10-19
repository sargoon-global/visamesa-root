import React, {useState} from 'react';
import {FlatList, Pressable, View, StyleProp, ViewStyle} from 'react-native';
import {useTranslation} from 'react-i18next';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {Text} from '@/components/ui/Text';
import {Icon} from '@/components/ui/Icon';
import {BottomSheet} from '@/components/ui/BottomSheet';
import {getFormControlContainerStyle} from '@/components/ui/formControlStyles';
import {TextField} from '@/components/ui/TextField';
import {FormFieldOption} from '@/features/forms/types/formTypes';
import {useSelectOptionsSearch} from '@/hooks/useSelectOptionsSearch';

export type SelectFieldProps = {
  label: string;
  value: string;
  options: FormFieldOption[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  hideLabel?: boolean;
  searchable?: boolean;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  placeholder,
  disabled = false,
  containerStyle,
  hideLabel = false,
  searchable = false,
}: SelectFieldProps) {
  const {styles, theme} = useStyles(stylesheet);
  const {t} = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const {query, setQuery, filteredOptions} = useSelectOptionsSearch(options);

  const resolvedPlaceholder =
    placeholder ?? t('select.placeholder');

  const selectedLabel =
    options.find(option => option.value === value)?.label ?? resolvedPlaceholder;

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {hideLabel ? null : (
        <Text variant="labelMedium" style={styles.label}>
          {label}
        </Text>
      )}
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{disabled, expanded: isOpen}}
        accessibilityLabel={label}
        android_ripple={
          disabled
            ? undefined
            : {color: theme.colors.primaryContainer}
        }
        onPress={() => setIsOpen(true)}
        style={({pressed}) => [
          getFormControlContainerStyle(theme, {
            error: Boolean(error),
            disabled,
          }),
          styles.trigger,
          pressed && !disabled && styles.triggerPressed,
        ]}>
        <Text
          variant="bodyLarge"
          color={value ? 'onSurface' : 'onSurfaceVariant'}
          style={styles.triggerText}>
          {selectedLabel}
        </Text>
        <Icon name="expand-more" size="md" color="onSurfaceVariant" />
      </Pressable>
      {error ? (
        <Text variant="bodySmall" color="error" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <BottomSheet visible={isOpen} onClose={handleClose} title={label}>
        {searchable ? (
          <View style={styles.search}>
            <TextField
              label={t('select.searchLabel')}
              value={query}
              onChangeText={setQuery}
              placeholder={t('select.searchPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : null}
        <FlatList
          data={filteredOptions}
          keyExtractor={item => item.value}
          keyboardShouldPersistTaps="handled"
          renderItem={({item}) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{selected: item.value === value}}
              android_ripple={{color: theme.colors.primaryContainer}}
              onPress={() => handleSelect(item.value)}
              style={({pressed}) => [
                styles.option,
                item.value === value && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}>
              <Text
                variant="bodyLarge"
                color={item.value === value ? 'primary' : 'onSurface'}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </BottomSheet>
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
  search: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerPressed: {
    opacity: 0.88,
  },
  triggerText: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  error: {
    marginTop: theme.spacing.xs / 2,
  },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  optionSelected: {
    backgroundColor: theme.colors.primaryContainer,
  },
  optionPressed: {
    opacity: 0.88,
  },
}));
