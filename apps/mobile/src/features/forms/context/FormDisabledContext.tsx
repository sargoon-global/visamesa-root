import React, {createContext, useContext} from 'react';

const FormDisabledContext = createContext(false);

export function FormDisabledProvider({
  disabled,
  children,
}: {
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <FormDisabledContext.Provider value={disabled}>
      {children}
    </FormDisabledContext.Provider>
  );
}

export function useFormDisabled(): boolean {
  return useContext(FormDisabledContext);
}
