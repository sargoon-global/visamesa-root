import {sizes, typography} from '@visamesa/design-tokens';

const MARK_ASPECT = 530 / 344
const LOGOTYPE_ASPECT = 522 / 55

const LOGOTYPE_HEIGHT = {
  header: typography.labelLarge.fontSize,
  hero: typography.titleLarge.fontSize,
} as const;

function dimensionsForMarkHeight(markHeight: number, logotypeHeight: number) {
  return {
    mark: {
      width: Math.round(markHeight * MARK_ASPECT),
      height: markHeight,
    },
    logotype: {
      width: Math.round(logotypeHeight * LOGOTYPE_ASPECT),
      height: logotypeHeight,
    },
  }
}

export function getBrandLogoDimensions(size: 'header' | 'hero') {
  if (size === 'hero') {
    return dimensionsForMarkHeight(sizes.brand.markHeightHero, LOGOTYPE_HEIGHT.hero)
  }

  return dimensionsForMarkHeight(sizes.brand.markHeightDesktop, LOGOTYPE_HEIGHT.header);
}
