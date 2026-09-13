import React from 'react';
import {View} from 'react-native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {TabIconName} from '@/navigation/tabConfig';
import {MaterialIcons} from '@react-native-vector-icons/material-icons/static';
import {BottomTabNavigationOptions} from '@react-navigation/bottom-tabs';

const TAB_ICON_SIZE = 24;

function createTabIcon(
  name: TabIconName,
): NonNullable<BottomTabNavigationOptions['tabBarIcon']> {
  return ({color, size, focused}) => {
    const {styles, theme} = useStyles(stylesheet);

    const icon = (
      <MaterialIcons name={name} size={size || TAB_ICON_SIZE} color={color} />
    );

    if (!focused) {
      return icon;
    }

    return (
      <View
        style={[
          styles.activeIndicator,
          {
            backgroundColor: theme.colors.secondaryContainerSubtle,
          },
        ]}>
        {icon}
      </View>
    );
  };
}

const stylesheet = createStyleSheet(theme => ({
  activeIndicator: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.radii.full,
  },
}));

export const TAB_BAR_ICONS: Record<
  TabIconName,
  NonNullable<BottomTabNavigationOptions['tabBarIcon']>
> = {
  home: createTabIcon('home'),
  checklist: createTabIcon('checklist'),
  person: createTabIcon('person'),
};
