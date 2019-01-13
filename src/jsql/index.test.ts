import { object, string } from './index';


describe('object', () => {
  const type1 = object({
    title: string,
    subtitle: string.optional,
  });
  it('works', () => {
    const value = type1.decode({ title: 'foo', bar: 'blah' });
    expect(value).toEqual({ title: 'foo' });
  });
  it('throws if field is not provided', () => {
    expect(() => type1.decode({ bar: 'blah' })).toThrowError();
  })
});
