import React from 'react';

import {
  FormDisabledProvider,
  useFormDisabled,
} from '@/features/forms/context/FormDisabledContext';
import {renderHook, unmountRenderedHook} from '@/test/renderHook';

describe('FormDisabledContext', () => {
  afterEach(() => {
    unmountRenderedHook();
  });

  it('provides disabled state to descendants', () => {
    const getEnabled = renderHook(
      () => ({disabled: useFormDisabled()}),
      ({children}) => (
        <FormDisabledProvider disabled={false}>{children}</FormDisabledProvider>
      ),
    );

    expect(getEnabled().disabled).toBe(false);

    unmountRenderedHook();

    const getDisabled = renderHook(
      () => ({disabled: useFormDisabled()}),
      ({children}) => (
        <FormDisabledProvider disabled={true}>{children}</FormDisabledProvider>
      ),
    );

    expect(getDisabled().disabled).toBe(true);
  });
});
