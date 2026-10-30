import {getChangedPersonalFields} from '@/features/profile/utils/getChangedPersonalFields';
import {completePersonalRecord} from '@/test/fixtures/personalInfo';

describe('getChangedPersonalFields', () => {
  it('returns empty when values are unchanged', () => {
    expect(
      getChangedPersonalFields(
        {...completePersonalRecord},
        {...completePersonalRecord},
      ),
    ).toEqual([]);
  });

  it('detects email changes', () => {
    const changed = getChangedPersonalFields(
      {...completePersonalRecord},
      {...completePersonalRecord, email: 'other@example.com'},
    );

    expect(changed).toContain('email');
  });

  it('normalizes phone object comparison', () => {
    const changed = getChangedPersonalFields(
      {...completePersonalRecord, phoneNumber: '+34|600000000'},
      {
        ...completePersonalRecord,
        phoneNumber: {countryCode: '+34', number: '600000000'},
      },
    );

    expect(changed).not.toContain('phoneNumber');
  });
});
