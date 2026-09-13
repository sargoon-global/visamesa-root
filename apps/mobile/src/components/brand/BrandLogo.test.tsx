import React from 'react';

import {BrandLogo} from './BrandLogo';
import {renderComponent} from '@/test/testRenderer';

describe('BrandLogo', () => {
  it('exposes a single accessible label for the combined mark and logotype', () => {
    const tree = renderComponent(
      <BrandLogo accessibilityLabel="VisaMesa" size="hero" />,
    );
    const json = JSON.stringify(tree.toJSON());

    expect(json).toContain('VisaMesa');
  });
});
