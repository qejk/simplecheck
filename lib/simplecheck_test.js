import expect, { createSpy, spyOn, isSpy } from 'expect';

import { matches, oneOf, optional, ensure, MatchError, anything, Integer} from './simplecheck';

class MyClass {
  constructor(value) {
    this.value = value;
  }
}

class MyChildClass extends MyClass {
  constructor(value) {
    super(value)
  }
}

class MyOtherClass {
  constructor(value) {
    this.value = value;
  }
}

describe('check', () => {
  describe('checkType()', () => {
    const params = [
      ['foo', String, true],
      [10, Number, true],
      [false, Boolean, true],
      [['foo'], Array, true],

      // This one is important, anything that is instanceof Object will be true. This is OK because if you need a
      // specific object you can use the object syntax
      [['foo'], Object, true],

      ['foo', Number, false],
      [10, String, false],
      [8, Boolean, false],
      [function() {
        return true;
      }, Function, true],
      [null, optional(String), true],
      ['foo', optional(String), true],
      [10, optional(String), false],
      [10, oneOf(String, Number), true],
      [10, oneOf(String, Boolean), false],
      [-1, Integer, true],
      [0, Integer, true],
      [1, Integer, true],
      [-2147483648, Integer, true], // INT_MIN
      [2147483647, Integer, true], // INT_MAX
      [123.33, Integer, false],
      [.33, Integer, false],
      [1.348192308491824e+23, Integer, false],
      [NaN, Integer, false],
      [Infinity, Integer, false],
      [-Infinity, Integer, false],
      [MyClass, Integer, false],
      [new MyClass('test'), Integer, false],
      [{}, Integer, false],
      [[], Integer, false],
      [function () {}, Integer, false],
      [new Date, Integer, false],
      [new MyClass('foo'), MyClass, true],
      [new MyChildClass('foo'), MyClass, true],
      [new MyOtherClass('foo'), MyClass, false],
      [new MyChildClass('foo'), new MyClass('foo'), false],
      [MyClass, MyClass, true],
      [MyChildClass, MyClass, false],
      [MyOtherClass, MyClass, false],
      [undefined, MyClass, false],
      [undefined, undefined, true],
      [{
        foo: new MyClass('foo'),
        bar: 'bar'
      }, {
        foo: MyClass,
        bar: String
      }, true],
      [{
        foo: new MyClass('foo'),
        bar: 'bar'
      }, {
        foo: optional(MyClass),
        bar: String
      }, true],
      [{
        foo: 'bar'
      }, {
        foo: String
      }, true],
      [{
        foo: 'bar',
        baz: 'bing'
      }, {
        foo: String
      }, false],
      [{
        foo: 'bar'
      }, {
        foo: String,
        baz: optional(String)
      }, true],
      [{
        foo: 'bar',
        baz: 'bing'
      }, {
        foo: String,
        baz: optional(String)
      }, true],
      [{
        foo: 'bar',
        baz: 10
      }, {
        foo: String,
        baz: optional(String)
      }, false],
      [new Date(), Date, true],
      [new Object(), Date, false],
      [['foo', 'foo'], [String], true],
      [['foo'], [Number], false],
      [[{
        foo: 'bar'
      }], [{
        foo: String
      }], true],
      [[{
        foo: 'bar'
      }], [{
        foo: Number
      }], false],
      [[{
        foo: 'bar'
      }, 10], [{
        foo: String
      }], false],
      [['foo', 10], [oneOf(String, Number)], true],
      ['foo', oneOf('foo', 'bar'), true],
      ['foo', oneOf('bar', 'baz'), false],
      ['foo', /^foo$/g, true],
      ['foo', oneOf('bar', /^foo$/g), true],
      ['foo', oneOf('bar', /^asdf$/g), false],
      ['foo', oneOf('bar', /fo/g), true],
      [{
        foo: 'bar'
      }, {
        foo: /ba/g
      }, true],
      [{
        foo:'bar',
        baz:{foo:'bar'}
      }, {
        foo:optional(anything),
        baz:anything,
        other:oneOf(anything),
      }, true],
      [{
        foo:['asdf', 'asdf']
      }, {
        foo:optional(null)
      }, false],
    ];

    params.forEach((param, idx) => {
      it('param #' + idx.toString(), () => {
        expect(matches(param[0], param[1]), true).toEqual(param[2]);
      });
    });
  });

  it('ensure()', () => {
    expect(() => ensure('foo', Number)).toThrow(MatchError);
  });

  it('ensure with non-array trying to match array', () => {
    expect(() => {
      ensure({
        foo: 'bar',
      }, {
        foo: [String],
      });
    }).toThrow(MatchError);
  })
});
