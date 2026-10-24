export type CitaPreviaDetails = {
  nie: string;
  Name: string;
  nationality: number;
  phone?: string;
  email?: string;
  documentType?: 'nie' | 'dni' | 'passport';
};

export interface CitaPreviaBookingAssistantProfile {
  details: CitaPreviaDetails;
  provinceOptionIndex: number;
  tramitesOptionIndex: number;
  sedeOptionIndex?: number;
}

/** Site-specific dropdown indices for Barcelona TIE fingerprint appointments. */
export const CITA_PREVIA_BOOKING_DEFAULTS = {
  provinceOptionIndex: 9,
  tramitesOptionIndex: 17,
  defaultNationality: 88,
} as const;

/** Demo profile for script tests — not used in production injection. */
export const citaPreviaPiiConfig: CitaPreviaBookingAssistantProfile = {
  details: {
    nie: 'Y6950398L',
    Name: 'Girish Sardar',
    nationality: CITA_PREVIA_BOOKING_DEFAULTS.defaultNationality,
    documentType: 'nie',
    phone: '600123456',
    email: 'test@example.com',
  },
  provinceOptionIndex: CITA_PREVIA_BOOKING_DEFAULTS.provinceOptionIndex,
  tramitesOptionIndex: CITA_PREVIA_BOOKING_DEFAULTS.tramitesOptionIndex,
  sedeOptionIndex: 0,
};

export const emptyCitaPreviaBookingAssistantProfile: CitaPreviaBookingAssistantProfile =
  {
    details: {
      nie: '',
      Name: '',
      nationality: CITA_PREVIA_BOOKING_DEFAULTS.defaultNationality,
      documentType: 'nie',
    },
    provinceOptionIndex: CITA_PREVIA_BOOKING_DEFAULTS.provinceOptionIndex,
    tramitesOptionIndex: CITA_PREVIA_BOOKING_DEFAULTS.tramitesOptionIndex,
  };
