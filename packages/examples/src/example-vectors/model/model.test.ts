jest.mock('uuid/v4', () => {
  return () => '[mock-uuid]';
});

import { validateAndNormalize } from './model';

describe('validateAndNormalize', () => {
  it('handles empty object', () => {
    expect(validateAndNormalize({})).toEqual({
      title: '',
      canvas: undefined,
      users: {},
    });
  });

  it('fails on type mismatch', () => {
    expect(() =>
      validateAndNormalize({
        title: 5,
      }),
    ).toThrow('Invalid value 5 supplied to : ModelState/title: string');
  });
});
