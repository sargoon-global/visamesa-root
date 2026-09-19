import {
  selectProfileCompleteness,
  isPersonalInformationComplete,
  isLegalPrivacyComplete,
  isPaymentComplete,
} from './selectProfileCompleteness';
import {ProfileData} from '../types/ProfileData';

describe('selectProfileCompleteness', () => {
  const completeProfileData: ProfileData = {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      gender: 'male',
      dateOfBirth: '1995-05-01',
      cityOfBirth: 'New York',
      countryOfBirth: 'US',
      nationality: 'US',
      maritalStatus: 'single',
      fatherName: 'John Doe Sr',
      motherName: 'Jane Doe',
      nieNumber: 'X1234567Y',
      passportNumber: 'P12345678',
      address: '123 Main St',
      addressNumber: '12',
      city: 'Barcelona',
      province: 'Barcelona',
      postalCode: '08001',
      email: 'john@example.com',
      phoneNumber: {countryCode: '+34', number: '612345678'},
      hasEmpadronamiento: 'no',
    },
  };

  describe('isPersonalInformationComplete', () => {
    it('returns true when all required fields are filled', () => {
      expect(isPersonalInformationComplete(completeProfileData)).toBe(true);
    });

    it('returns false when profileData is null', () => {
      expect(isPersonalInformationComplete(null)).toBe(false);
    });

    it('returns false when personal data is missing', () => {
      expect(isPersonalInformationComplete({} as ProfileData)).toBe(false);
    });

    it('returns false when required field is empty', () => {
      const incomplete = {
        ...completeProfileData,
        personal: {
          ...completeProfileData.personal!,
          firstName: '',
        },
      };

      expect(isPersonalInformationComplete(incomplete)).toBe(false);
    });

    it('returns false when required field is null', () => {
      const incomplete = {
        ...completeProfileData,
        personal: {
          ...completeProfileData.personal!,
          lastName: null as any,
        },
      };

      expect(isPersonalInformationComplete(incomplete)).toBe(false);
    });

    it('returns false when phone number object is incomplete', () => {
      const incomplete = {
        ...completeProfileData,
        personal: {
          ...completeProfileData.personal!,
          phoneNumber: {countryCode: '+34', number: ''},
        },
      };

      expect(isPersonalInformationComplete(incomplete)).toBe(false);
    });
  });

  describe('isLegalPrivacyComplete', () => {
    it('returns true when consent is given', () => {
      expect(isLegalPrivacyComplete(true)).toBe(true);
    });

    it('returns false when consent is not given', () => {
      expect(isLegalPrivacyComplete(false)).toBe(false);
    });
  });

  describe('isPaymentComplete', () => {
    it('returns true when user has paid', () => {
      expect(isPaymentComplete(true)).toBe(true);
    });

    it('returns false when user has not paid', () => {
      expect(isPaymentComplete(false)).toBe(false);
    });
  });

  describe('selectProfileCompleteness', () => {
    it('returns correct completeness when all sections are complete', () => {
      const result = selectProfileCompleteness(completeProfileData, true, true);

      expect(result).toEqual({
        personalInformation: true,
        legalPrivacy: true,
        payment: true,
      });
    });

    it('returns correct completeness when personal info is incomplete', () => {
      const result = selectProfileCompleteness(null, true, true);

      expect(result).toEqual({
        personalInformation: false,
        legalPrivacy: true,
        payment: true,
      });
    });

    it('returns correct completeness when consent is missing', () => {
      const result = selectProfileCompleteness(completeProfileData, false, true);

      expect(result).toEqual({
        personalInformation: true,
        legalPrivacy: false,
        payment: true,
      });
    });

    it('returns correct completeness when payment is missing', () => {
      const result = selectProfileCompleteness(completeProfileData, true, false);

      expect(result).toEqual({
        personalInformation: true,
        legalPrivacy: true,
        payment: false,
      });
    });

    it('returns correct completeness when all sections are incomplete', () => {
      const result = selectProfileCompleteness(null, false, false);

      expect(result).toEqual({
        personalInformation: false,
        legalPrivacy: false,
        payment: false,
      });
    });
  });
});
