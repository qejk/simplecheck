'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x7, _x8, _x9) { var _again = true; _function: while (_again) { var object = _x7, property = _x8, receiver = _x9; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x7 = parent; _x8 = property; _x9 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

exports.optional = optional;
exports.anything = anything;
exports.oneOf = oneOf;
exports.ensure = ensure;
exports.matches = matches;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var nativeTypes = [String, Boolean, Date, Number, RegExp, Object, Array, Function];

function scalarTypeMap(value) {
  switch (value) {
    case String:
      return 'string';
    case Boolean:
      return 'boolean';
    case Number:
      return 'number';
    default:
      return null;
  }
}

// This is here until the guy running the es6-error package merges the pull request fixing this

var ExtendableError = (function (_Error) {
  _inherits(ExtendableError, _Error);

  function ExtendableError() {
    var message = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

    _classCallCheck(this, ExtendableError);

    _get(Object.getPrototypeOf(ExtendableError.prototype), 'constructor', this).call(this, message);

    // extending Error is weird and does not propagate `message`
    Object.defineProperty(this, 'message', {
      enumerable: false,
      value: message
    });

    Object.defineProperty(this, 'name', {
      enumerable: false,
      value: this.constructor.name
    });

    if (Error.hasOwnProperty('captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      Object.defineProperty(this, 'stack', {
        enumerable: false,
        value: new Error(message).stack
      });
    }
  }

  return ExtendableError;
})(Error);

var MatchError = (function (_ExtendableError) {
  _inherits(MatchError, _ExtendableError);

  function MatchError(message) {
    _classCallCheck(this, MatchError);

    _get(Object.getPrototypeOf(MatchError.prototype), 'constructor', this).call(this, _util2['default'].format.apply(_util2['default'], arguments));
  }

  /**
   * Ensure match only if value is neither undefined nor null
   * @param  {mixed} pattern The pattern to match
   * @return {mixed}         Either `true` if OK or a MatchFailure if not
   */
  return MatchError;
})(ExtendableError);

exports.MatchError = MatchError;

function optional(pattern) {
  return function (value) {
    if (value === undefined || value === null) {
      return true;
    }
    return checkType(value, pattern);
  };
}

/**
 * Allow any value of any type
 * @return {Boolean} allowed
 */

function anything() {
  return true;
}

var typesInArray = function typesInArray(choices) {
  var names = choices.map(function (choice) {
    if (choice !== null && choice.constructor && choice.constructor === Array) {
      return '[(' + typesInArray(choice) + ']';
    } else if (choice === null) {
      return 'null';
    } else {
      return choice.name;
    }
  });
  return JSON.stringify(names);
};
/**
 * Ensure value matches one of the provided arguments (arguments can be anything that can be used as a matcher, like
 * String or an object with matcher properties)
 * @return {mixed} Either `true` if OK or a MatchFailure if not
 */

function oneOf() {
  var args = Array.prototype.slice.call(arguments);
  return function (value) {
    for (var i = 0; i < args.length; i++) {
      try {
        checkType(value, args[i]);
        return true;
      } catch (err) {}
    }
    throw new MatchError('Expected %s to be one of %s', JSON.stringify(value), typesInArray(args));
  };
}

/**
 * Run the main check function but throw an exception if it fails
 *
 * @see  arguments for check
 */

function ensure(value, pattern) {
  var strict = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  checkType(value, pattern, strict);
  return true;
}

/**
 * Check if a value matches a pattern
 * @param  {mixed}  value   The value to check
 * @param  {mixed}  pattern The pattern (see tests for examples)
 * @param  {Boolean} strict  Will get passed down to all calls of checkObject (see that function description)
 * @return {Boolean}          True if OK, false if not
 */

function matches(value, pattern) {
  var strict = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  try {
    ensure(value, pattern, strict);
    return true;
  } catch (err) {
    return false;
  }
}

function validateClassPattern(value, pattern) {
  var valid = undefined;
  // Value is an instance, pattern is a class
  if (value.constructor.name !== 'Function' && pattern.constructor.name === 'Function') {
    valid = value instanceof pattern;
    // Value and pattern are both classes
  } else {
      valid = String(pattern.name) === String(value.name);
    }
  return valid;
}

function getExpectedType(pattern) {
  var expectedType = JSON.stringify(pattern);
  if (expectedType === undefined && pattern.name) {
    expectedType = pattern.name;
  }
  if (expectedType === 'Function') {
    expectedType = expectedType.toLowerCase();
  }
  return expectedType;
}

function checkType(value, pattern) {
  var strict = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  var valid = true;
  var typeMap = scalarTypeMap(pattern);
  if (typeMap) {
    if (typeof value !== typeMap.toLowerCase()) {
      throw new MatchError('Expected %s to be a %s', JSON.stringify(value), typeMap);
    }
  } else if (pattern instanceof Function && nativeTypes.indexOf(pattern) < 0) {
    try {
      // Pattern is a class that should be run with new
      valid = pattern(value);
    } catch (e) {
      // Fallow up from onOf
      if (e.name == 'MatchError') {
        throw e;
      } else if (pattern.constructor) {
        valid = validateClassPattern(value, pattern);
      } else {
        // Fallback
        valid = pattern(value);
      }
    }
    // Forgot to run Space.domain.ValueObject with new
    if (valid === undefined) {
      valid = validateClassPattern(value, pattern);
    }
  } else if (pattern instanceof Array && nativeTypes.indexOf(pattern) < 0) {
    valid = checkArray(value, pattern[0]);
  } else if (pattern instanceof RegExp && nativeTypes.indexOf(pattern) < 0) {
    if (!pattern.test(value)) {
      throw new MatchError('Expected %s to match pattern %s', JSON.stringify(value), pattern);
    }
  } else if (pattern instanceof Object && nativeTypes.indexOf(pattern) < 0) {
    valid = checkObject(value, pattern, strict);
  } else {
    // Could be a oneOf with exact values
    if (value === pattern) {
      return true;
    } else if (!(value instanceof pattern)) {
      var expectedType = getExpectedType(pattern);
      var msg = undefined;
      if (expectedType === 'function') {
        msg = 'Expected %s to be a %s';
      } else {
        msg = 'Expected %s to be an instance of %s';
      }
      throw new MatchError(msg, JSON.stringify(value), expectedType);
    }
  }
  if (!valid) {
    var expectedType = getExpectedType(pattern);
    var msg = undefined;
    if (JSON.stringify(pattern) === undefined && pattern.name) {
      msg = 'Invalid match (%s expected to be instance of %s)';
    } else {
      msg = 'Invalid match (%s expected to be %s)';
    }
    throw new MatchError(msg, JSON.stringify(value), expectedType);
  }
  return valid;
}

function checkArray(arr, pattern) {
  var strict = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  if (!(arr instanceof Array)) {
    throw new MatchError('Expected %s to be an array', JSON.stringify(arr));
  }

  arr.forEach(function (elem) {
    checkType(elem, pattern, strict);
  });

  return true;
}

function checkObject(value, pattern) {
  var strict = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

  if (typeof value !== 'object') {
    throw new MatchError('Expected %s to be an object', JSON.stringify(value));
  }
  for (var k in pattern) {
    try {
      checkType(value[k], pattern[k]);
    } catch (err) {
      throw new MatchError('(Key ' + k + ' in ' + JSON.stringify(value) + ') - ' + err.message);
    }
  }

  if (strict) {
    // When value or pattern(or both) are instances, verify their class names
    if (value.constructor || pattern.constructor) {
      if (value.constructor.name !== pattern.constructor.name) {
        throw new MatchError('Expected instance of %s to be instance of %s', value.constructor.name, pattern.constructor.name);
      }
    }
    for (var k in value) {
      if (!pattern[k]) {
        throw new MatchError('Unknown key %s in %s', k, JSON.stringify(value));
      }
    }
  }
  return true;
}
