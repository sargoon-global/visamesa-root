import {completePersonalRecord} from '@/test/fixtures/personalInfo';

import {parsePersonalInfo, parsePersonalInfoFieldNames} from './parsePersonalInfo';

describe('parsePersonalInfo', () => {
  it('accepts a complete personal record', () => {
    expect(parsePersonalInfo(completePersonalRecord).ok).toBe(true);
  });

  it('rejects missing street type', () => {
    expect(
      parsePersonalInfo({...completePersonalRecord, streetType: ''}).ok,
    ).toBe(false);
  });

  it('reports missing field ids for incomplete records', () => {
    expect(parsePersonalInfo({...completePersonalRecord, streetType: ''}).ok).toBe(
      false,
    );
    expect(
      parsePersonalInfoFieldNames({...completePersonalRecord, streetType: ''}),
    ).toBe('streetType');
  });

  it('accepts legacy compact phone strings after normalization in the record', () => {
    expect(
      parsePersonalInfo({
        ...completePersonalRecord,
        phoneNumber: '34600123456',
      }).ok,
    ).toBe(true);
  });
});
