'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MatchError = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

exports.optional = optional;
exports.anything = anything;
exports.oneOf = oneOf;
exports.Integer = Integer;
exports.ensure = ensure;
exports.matches = matches;

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _es6Error = require('es6-error');

var _es6Error2 = _interopRequireDefault(_es6Error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var MatchError = exports.MatchError = function (_ExtendableError) {
  (0, _inherits3.default)(MatchError, _ExtendableError);

  function MatchError(message) {
    (0, _classCallCheck3.default)(this, MatchError);
    return (0, _possibleConstructorReturn3.default)(this, (MatchError.__proto__ || (0, _getPrototypeOf2.default)(MatchError)).call(this, _util2.default.format.apply(_util2.default, arguments)));
  }

  return MatchError;
}(_es6Error2.default);

/**
 * Ensure match only if value is neither undefined nor null
 * @param  {mixed} pattern The pattern to match
 * @return {mixed}         Either `true` if OK or a MatchFailure if not
 */


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
  return (0, _stringify2.default)(names);
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
    throw new MatchError('Expected %s to be one of %s', (0, _stringify2.default)(value), typesInArray(args));
  };
}

/**
 * Ensure value is Integer. (arguments can be anything that can be used as a matcher, like
 * String or an object with matcher properties)
 * @return {mixed} Either `true` if OK or a MatchFailure if not
 */
function Integer() {
  var args = Array.prototype.slice.call(arguments);
  var value = args[0];
  if (typeof value === "number" && (value | 0) === value) {
    return true;
  } else {
    var expectedType = (0, _stringify2.default)(value);
    if (value.constructor && value.constructor === Array) {
      var _expectedType = typesInArray(args);
    }
    throw new MatchError('Expected Integer, got %s', (0, _stringify2.default)(value));
  }
}

/**
 * Run the main check function but throw an exception if it fails
 *
 * @see  arguments for check
 */
function ensure(value, pattern) {
  var strict = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

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
  var strict = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  try {
    ensure(value, pattern, strict);
    return true;
  } catch (err) {
    return false;
  }
}

function validateClassPattern(value, pattern) {
  var valid = void 0;
  // Value is undefined however pattern is a class
  if (value == undefined) {
    valid = false;
    // Value is an instance, pattern is a class
  } else if (value.constructor.name !== 'Function' && pattern.constructor.name === 'Function') {
    valid = value instanceof pattern;
    // Value and pattern are both classes
  } else {
    valid = String(pattern.name) === String(value.name);
  }
  return valid;
}

function getExpectedType(pattern) {
  var expectedType = (0, _stringify2.default)(pattern);
  if (expectedType === undefined && pattern.name) {
    expectedType = pattern.name;
  }
  if (expectedType === 'Function') {
    expectedType = expectedType.toLowerCase();
  }
  return expectedType;
}

function checkType(value, pattern) {
  var strict = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  var valid = true;
  var typeMap = scalarTypeMap(pattern);
  if (typeMap) {
    if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) !== typeMap.toLowerCase()) {
      throw new MatchError('Expected %s to be a %s', (0, _stringify2.default)(value), typeMap);
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
      throw new MatchError('Expected %s to match pattern %s', (0, _stringify2.default)(value), pattern);
    }
  } else if (pattern instanceof Object && nativeTypes.indexOf(pattern) < 0) {
    valid = checkObject(value, pattern, strict);
  } else {
    // Could be a oneOf with exact values
    if (value === pattern) {
      return true;
    } else if (!(value instanceof pattern)) {
      var expectedType = getExpectedType(pattern);
      var msg = void 0;
      if (expectedType === 'function') {
        msg = 'Expected %s to be a %s';
      } else {
        msg = 'Expected %s to be an instance of %s';
      }
      throw new MatchError(msg, (0, _stringify2.default)(value), expectedType);
    }
  }
  if (!valid) {
    var _expectedType2 = getExpectedType(pattern);
    var _msg = void 0;
    if ((0, _stringify2.default)(pattern) === undefined && pattern.name) {
      _msg = 'Invalid match (%s expected to be instance of %s)';
    } else {
      _msg = 'Invalid match (%s expected to be %s)';
    }
    throw new MatchError(_msg, (0, _stringify2.default)(value), _expectedType2);
  }
  return valid;
}

function checkArray(arr, pattern) {
  var strict = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  if (!(arr instanceof Array)) {
    throw new MatchError('Expected %s to be an array', (0, _stringify2.default)(arr));
  }

  arr.forEach(function (elem) {
    checkType(elem, pattern, strict);
  });

  return true;
}

function checkObject(value, pattern) {
  var strict = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) !== 'object') {
    throw new MatchError('Expected %s to be an object', (0, _stringify2.default)(value));
  }
  for (var k in pattern) {
    try {
      checkType(value[k], pattern[k]);
    } catch (err) {
      throw new MatchError('(Key ' + k + ' in ' + (0, _stringify2.default)(value) + ') - ' + err.message);
    }
  }

  if (strict) {
    // When value or pattern(or both) are instances, verify their class names
    if (value.constructor || pattern.constructor) {
      if (value.constructor.name !== pattern.constructor.name) {
        throw new MatchError('Expected instance of %s to be instance of %s', value.constructor.name, pattern.constructor.name);
      }
    }
    for (var _k in value) {
      if (!pattern[_k]) {
        throw new MatchError('Unknown key %s in %s', _k, (0, _stringify2.default)(value));
      }
    }
  }
  return true;
}