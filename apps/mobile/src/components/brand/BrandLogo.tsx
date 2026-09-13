import React from 'react';
import {Image, View} from 'react-native';
import {createStyleSheet, useStyles} from 'react-native-unistyles';

import {brandAssets} from '@/brand/assets';

import {getBrandLogoDimensions} from './brandDimensions';

type BrandLogoProps = {
  size?: 'header' | 'hero';
  layout?: 'horizontal' | 'vertical';
  accessibilityLabel: string;
};

export function BrandLogo({
  size = 'header',
  layout = 'horizontal',
  accessibilityLabel,
}: BrandLogoProps) {
  const {styles} = useStyles(stylesheet);
  const {mark, logotype} = getBrandLogoDimensions(size);

  return (
    <View
      style={[styles.root, layout === 'vertical' ? styles.rootVertical : styles.rootHorizontal]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={brandAssets.logo}
        style={mark}
        resizeMode="contain"
        importantForAccessibility="no"
      />
      <Image
        source={brandAssets.logotype}
        style={logotype}
        resizeMode="contain"
        importantForAccessibility="no"
      />
    </View>
  );
}

const stylesheet = createStyleSheet(theme => ({
  root: {
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  rootHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rootVertical: {
    flexDirection: 'column',
    alignItems: 'center',
  },
}));
