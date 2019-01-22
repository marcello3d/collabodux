jest.mock('uuid/v4', () => {
  return () => '[mock-uuid]';
});

import { validateAndNormalize } from './model';

describe('validateAndNormalize', () => {
  it('handles empty object', () => {
    expect(validateAndNormalize({})).toEqual({
      longtext: '',
      subtitle: '',
      title: '',
      todos: [],
      users: {},
    });
  });

  it('handles non-empty object', () => {
    expect(
      validateAndNormalize({
        title: 'title',
        todos: [
          {
            done: false,
            label: 'hi',
          },
          {},
        ],
      }),
    ).toEqual({
      longtext: '',
      subtitle: '',
      title: 'title',
      todos: [
        {
          done: false,
          key: '[mock-uuid]',
          label: 'hi',
        },
        { done: false, key: '[mock-uuid]', label: '' },
      ],
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
