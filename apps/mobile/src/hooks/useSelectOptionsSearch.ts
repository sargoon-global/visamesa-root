import {useMemo, useState} from 'react';

import type {FormFieldOption} from '@/features/forms/types/formTypes';
import {normalizeSearchText} from '@/utils/normalizeSearchText';

export function useSelectOptionsSearch(options: FormFieldOption[]) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option =>
      normalizeSearchText(option.label).includes(normalizedQuery),
    );
  }, [options, query]);

  return {
    query,
    setQuery,
    filteredOptions,
  };
}
