export const STREET_TYPE_VALUES = [
  'Calle',
  'Carrer',
  'Avenida',
  'Avinguda',
  'Paseo',
  'Passeig',
  'Plaza',
  'Plaça',
  'Ronda',
  'Travesía',
  'Camino',
  'Carretera',
  'Otro',
] as const;

export type StreetType = (typeof STREET_TYPE_VALUES)[number];

const STREET_TYPE_PREFIX =
  /^(Calle|Carrer|Avenida|Avinguda|Avda|Passeig|Paseo|Plaza|Plaça|Ronda|Travessera|Travesía|Camino|Carretera)\s+(.+)$/i;

export function splitLegacyAddress(address: string): {
  streetType?: StreetType;
  streetName: string;
} {
  const trimmed = address.trim();
  const match = trimmed.match(STREET_TYPE_PREFIX);
  if (!match) {
    return {streetName: trimmed};
  }

  let streetType = match[1];
  if (streetType.toLowerCase() === 'avda') {
    streetType = 'Avenida';
  }
  if (streetType.toLowerCase() === 'travessera') {
    streetType = 'Travesía';
  }

  const normalizedType = STREET_TYPE_VALUES.find(
    value => value.toLowerCase() === streetType.toLowerCase(),
  );

  return {
    streetType: normalizedType,
    streetName: match[2].trim(),
  };
}

export function streetTypeFormOptions() {
  return STREET_TYPE_VALUES.map(value => ({
    label: `schemas.profilePersonal.options.streetType.${valueToOptionKey(value)}`,
    value,
  }));
}

function valueToOptionKey(value: StreetType): string {
  const map: Record<StreetType, string> = {
    Calle: 'calle',
    Carrer: 'carrer',
    Avenida: 'avenida',
    Avinguda: 'avinguda',
    Paseo: 'paseo',
    Passeig: 'passeig',
    Plaza: 'plaza',
    'Plaça': 'placa',
    Ronda: 'ronda',
    Travesía: 'travesia',
    Camino: 'camino',
    Carretera: 'carretera',
    Otro: 'otro',
  };
  return map[value];
}
