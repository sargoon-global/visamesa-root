export type Modelo790AutomationProfile = {
  documentNumber: string;
  fullName: string;
  address: {
    streetType?: string;
    streetName: string;
    number?: string;
    floor?: string;
    door?: string;
    city: string;
    province: string;
    postalCode: string;
  };
  phoneNumber?: string;
  feeInputId: string;
  paymentMethod: 'cash' | 'debit';
};
