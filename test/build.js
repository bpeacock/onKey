(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require("JkpR2F"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"JkpR2F":2,"inherits":1}],5:[function(require,module,exports){
/*jslint eqeqeq: false, onevar: false, forin: true, nomen: false, regexp: false, plusplus: false*/
/*global module, require, __dirname, document*/
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

var sinon = (function (formatio) {
    var div = typeof document != "undefined" && document.createElement("div");
    var hasOwn = Object.prototype.hasOwnProperty;

    function isDOMNode(obj) {
        var success = false;

        try {
            obj.appendChild(div);
            success = div.parentNode == obj;
        } catch (e) {
            return false;
        } finally {
            try {
                obj.removeChild(div);
            } catch (e) {
                // Remove failed, not much we can do about that
            }
        }

        return success;
    }

    function isElement(obj) {
        return div && obj && obj.nodeType === 1 && isDOMNode(obj);
    }

    function isFunction(obj) {
        return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
    }

    function mirrorProperties(target, source) {
        for (var prop in source) {
            if (!hasOwn.call(target, prop)) {
                target[prop] = source[prop];
            }
        }
    }

    function isRestorable (obj) {
        return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
    }

    var sinon = {
        wrapMethod: function wrapMethod(object, property, method) {
            if (!object) {
                throw new TypeError("Should wrap property of object");
            }

            if (typeof method != "function") {
                throw new TypeError("Method wrapper should be function");
            }

            var wrappedMethod = object[property],
                error;

            if (!isFunction(wrappedMethod)) {
                error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
                                    property + " as function");
            }

            if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
                error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
            }

            if (wrappedMethod.calledBefore) {
                var verb = !!wrappedMethod.returns ? "stubbed" : "spied on";
                error = new TypeError("Attempted to wrap " + property + " which is already " + verb);
            }

            if (error) {
                if (wrappedMethod._stack) {
                    error.stack += '\n--------------\n' + wrappedMethod._stack;
                }
                throw error;
            }

            // IE 8 does not support hasOwnProperty on the window object and Firefox has a problem
            // when using hasOwn.call on objects from other frames.
            var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwn.call(object, property);
            object[property] = method;
            method.displayName = property;
            // Set up a stack trace which can be used later to find what line of
            // code the original method was created on.
            method._stack = (new Error('Stack Trace for original')).stack;

            method.restore = function () {
                // For prototype properties try to reset by delete first.
                // If this fails (ex: localStorage on mobile safari) then force a reset
                // via direct assignment.
                if (!owned) {
                    delete object[property];
                }
                if (object[property] === method) {
                    object[property] = wrappedMethod;
                }
            };

            method.restore.sinon = true;
            mirrorProperties(method, wrappedMethod);

            return method;
        },

        extend: function extend(target) {
            for (var i = 1, l = arguments.length; i < l; i += 1) {
                for (var prop in arguments[i]) {
                    if (arguments[i].hasOwnProperty(prop)) {
                        target[prop] = arguments[i][prop];
                    }

                    // DONT ENUM bug, only care about toString
                    if (arguments[i].hasOwnProperty("toString") &&
                        arguments[i].toString != target.toString) {
                        target.toString = arguments[i].toString;
                    }
                }
            }

            return target;
        },

        create: function create(proto) {
            var F = function () {};
            F.prototype = proto;
            return new F();
        },

        deepEqual: function deepEqual(a, b) {
            if (sinon.match && sinon.match.isMatcher(a)) {
                return a.test(b);
            }
            if (typeof a != "object" || typeof b != "object") {
                return a === b;
            }

            if (isElement(a) || isElement(b)) {
                return a === b;
            }

            if (a === b) {
                return true;
            }

            if ((a === null && b !== null) || (a !== null && b === null)) {
                return false;
            }

            var aString = Object.prototype.toString.call(a);
            if (aString != Object.prototype.toString.call(b)) {
                return false;
            }

            if (aString == "[object Date]") {
                return a.valueOf() === b.valueOf();
            }

            var prop, aLength = 0, bLength = 0;

            if (aString == "[object Array]" && a.length !== b.length) {
                return false;
            }

            for (prop in a) {
                aLength += 1;

                if (!deepEqual(a[prop], b[prop])) {
                    return false;
                }
            }

            for (prop in b) {
                bLength += 1;
            }

            return aLength == bLength;
        },

        functionName: function functionName(func) {
            var name = func.displayName || func.name;

            // Use function decomposition as a last resort to get function
            // name. Does not rely on function decomposition to work - if it
            // doesn't debugging will be slightly less informative
            // (i.e. toString will say 'spy' rather than 'myFunc').
            if (!name) {
                var matches = func.toString().match(/function ([^\s\(]+)/);
                name = matches && matches[1];
            }

            return name;
        },

        functionToString: function toString() {
            if (this.getCall && this.callCount) {
                var thisValue, prop, i = this.callCount;

                while (i--) {
                    thisValue = this.getCall(i).thisValue;

                    for (prop in thisValue) {
                        if (thisValue[prop] === this) {
                            return prop;
                        }
                    }
                }
            }

            return this.displayName || "sinon fake";
        },

        getConfig: function (custom) {
            var config = {};
            custom = custom || {};
            var defaults = sinon.defaultConfig;

            for (var prop in defaults) {
                if (defaults.hasOwnProperty(prop)) {
                    config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
                }
            }

            return config;
        },

        format: function (val) {
            return "" + val;
        },

        defaultConfig: {
            injectIntoThis: true,
            injectInto: null,
            properties: ["spy", "stub", "mock", "clock", "server", "requests"],
            useFakeTimers: true,
            useFakeServer: true
        },

        timesInWords: function timesInWords(count) {
            return count == 1 && "once" ||
                count == 2 && "twice" ||
                count == 3 && "thrice" ||
                (count || 0) + " times";
        },

        calledInOrder: function (spies) {
            for (var i = 1, l = spies.length; i < l; i++) {
                if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
                    return false;
                }
            }

            return true;
        },

        orderByFirstCall: function (spies) {
            return spies.sort(function (a, b) {
                // uuid, won't ever be equal
                var aCall = a.getCall(0);
                var bCall = b.getCall(0);
                var aId = aCall && aCall.callId || -1;
                var bId = bCall && bCall.callId || -1;

                return aId < bId ? -1 : 1;
            });
        },

        log: function () {},

        logError: function (label, err) {
            var msg = label + " threw exception: ";
            sinon.log(msg + "[" + err.name + "] " + err.message);
            if (err.stack) { sinon.log(err.stack); }

            setTimeout(function () {
                err.message = msg + err.message;
                throw err;
            }, 0);
        },

        typeOf: function (value) {
            if (value === null) {
                return "null";
            }
            else if (value === undefined) {
                return "undefined";
            }
            var string = Object.prototype.toString.call(value);
            return string.substring(8, string.length - 1).toLowerCase();
        },

        createStubInstance: function (constructor) {
            if (typeof constructor !== "function") {
                throw new TypeError("The constructor should be a function.");
            }
            return sinon.stub(sinon.create(constructor.prototype));
        },

        restore: function (object) {
            if (object !== null && typeof object === "object") {
                for (var prop in object) {
                    if (isRestorable(object[prop])) {
                        object[prop].restore();
                    }
                }
            }
            else if (isRestorable(object)) {
                object.restore();
            }
        }
    };

    var isNode = typeof module !== "undefined" && module.exports;
    var isAMD = typeof define === 'function' && typeof define.amd === 'object' && define.amd;

    if (isAMD) {
        define(function(){
            return sinon;
        });
    } else if (isNode) {
        try {
            formatio = require("formatio");
        } catch (e) {}
        module.exports = sinon;
        module.exports.spy = require("./sinon/spy");
        module.exports.spyCall = require("./sinon/call");
        module.exports.behavior = require("./sinon/behavior");
        module.exports.stub = require("./sinon/stub");
        module.exports.mock = require("./sinon/mock");
        module.exports.collection = require("./sinon/collection");
        module.exports.assert = require("./sinon/assert");
        module.exports.sandbox = require("./sinon/sandbox");
        module.exports.test = require("./sinon/test");
        module.exports.testCase = require("./sinon/test_case");
        module.exports.assert = require("./sinon/assert");
        module.exports.match = require("./sinon/match");
    }

    if (formatio) {
        var formatter = formatio.configure({ quoteStrings: false });
        sinon.format = function () {
            return formatter.ascii.apply(formatter, arguments);
        };
    } else if (isNode) {
        try {
            var util = require("util");
            sinon.format = function (value) {
                return typeof value == "object" && value.toString === Object.prototype.toString ? util.inspect(value) : value;
            };
        } catch (e) {
            /* Node, but no util module - would be very old, but better safe than
             sorry */
        }
    }

    return sinon;
}(typeof formatio == "object" && formatio));

},{"./sinon/assert":6,"./sinon/behavior":7,"./sinon/call":8,"./sinon/collection":9,"./sinon/match":10,"./sinon/mock":11,"./sinon/sandbox":12,"./sinon/spy":13,"./sinon/stub":14,"./sinon/test":15,"./sinon/test_case":16,"formatio":18,"util":4}],6:[function(require,module,exports){
(function (global){
/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Assertions matching the test spy retrieval interface.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon, global) {
    var commonJSModule = typeof module !== "undefined" && module.exports;
    var slice = Array.prototype.slice;
    var assert;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function verifyIsStub() {
        var method;

        for (var i = 0, l = arguments.length; i < l; ++i) {
            method = arguments[i];

            if (!method) {
                assert.fail("fake is not a spy");
            }

            if (typeof method != "function") {
                assert.fail(method + " is not a function");
            }

            if (typeof method.getCall != "function") {
                assert.fail(method + " is not stubbed");
            }
        }
    }

    function failAssertion(object, msg) {
        object = object || global;
        var failMethod = object.fail || assert.fail;
        failMethod.call(object, msg);
    }

    function mirrorPropAsAssertion(name, method, message) {
        if (arguments.length == 2) {
            message = method;
            method = name;
        }

        assert[name] = function (fake) {
            verifyIsStub(fake);

            var args = slice.call(arguments, 1);
            var failed = false;

            if (typeof method == "function") {
                failed = !method(fake);
            } else {
                failed = typeof fake[method] == "function" ?
                    !fake[method].apply(fake, args) : !fake[method];
            }

            if (failed) {
                failAssertion(this, fake.printf.apply(fake, [message].concat(args)));
            } else {
                assert.pass(name);
            }
        };
    }

    function exposedName(prefix, prop) {
        return !prefix || /^fail/.test(prop) ? prop :
            prefix + prop.slice(0, 1).toUpperCase() + prop.slice(1);
    }

    assert = {
        failException: "AssertError",

        fail: function fail(message) {
            var error = new Error(message);
            error.name = this.failException || assert.failException;

            throw error;
        },

        pass: function pass(assertion) {},

        callOrder: function assertCallOrder() {
            verifyIsStub.apply(null, arguments);
            var expected = "", actual = "";

            if (!sinon.calledInOrder(arguments)) {
                try {
                    expected = [].join.call(arguments, ", ");
                    var calls = slice.call(arguments);
                    var i = calls.length;
                    while (i) {
                        if (!calls[--i].called) {
                            calls.splice(i, 1);
                        }
                    }
                    actual = sinon.orderByFirstCall(calls).join(", ");
                } catch (e) {
                    // If this fails, we'll just fall back to the blank string
                }

                failAssertion(this, "expected " + expected + " to be " +
                              "called in order but were called as " + actual);
            } else {
                assert.pass("callOrder");
            }
        },

        callCount: function assertCallCount(method, count) {
            verifyIsStub(method);

            if (method.callCount != count) {
                var msg = "expected %n to be called " + sinon.timesInWords(count) +
                    " but was called %c%C";
                failAssertion(this, method.printf(msg));
            } else {
                assert.pass("callCount");
            }
        },

        expose: function expose(target, options) {
            if (!target) {
                throw new TypeError("target is null or undefined");
            }

            var o = options || {};
            var prefix = typeof o.prefix == "undefined" && "assert" || o.prefix;
            var includeFail = typeof o.includeFail == "undefined" || !!o.includeFail;

            for (var method in this) {
                if (method != "export" && (includeFail || !/^(fail)/.test(method))) {
                    target[exposedName(prefix, method)] = this[method];
                }
            }

            return target;
        }
    };

    mirrorPropAsAssertion("called", "expected %n to have been called at least once but was never called");
    mirrorPropAsAssertion("notCalled", function (spy) { return !spy.called; },
                          "expected %n to not have been called but was called %c%C");
    mirrorPropAsAssertion("calledOnce", "expected %n to be called once but was called %c%C");
    mirrorPropAsAssertion("calledTwice", "expected %n to be called twice but was called %c%C");
    mirrorPropAsAssertion("calledThrice", "expected %n to be called thrice but was called %c%C");
    mirrorPropAsAssertion("calledOn", "expected %n to be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("alwaysCalledOn", "expected %n to always be called with %1 as this but was called with %t");
    mirrorPropAsAssertion("calledWithNew", "expected %n to be called with new");
    mirrorPropAsAssertion("alwaysCalledWithNew", "expected %n to always be called with new");
    mirrorPropAsAssertion("calledWith", "expected %n to be called with arguments %*%C");
    mirrorPropAsAssertion("calledWithMatch", "expected %n to be called with match %*%C");
    mirrorPropAsAssertion("alwaysCalledWith", "expected %n to always be called with arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithMatch", "expected %n to always be called with match %*%C");
    mirrorPropAsAssertion("calledWithExactly", "expected %n to be called with exact arguments %*%C");
    mirrorPropAsAssertion("alwaysCalledWithExactly", "expected %n to always be called with exact arguments %*%C");
    mirrorPropAsAssertion("neverCalledWith", "expected %n to never be called with arguments %*%C");
    mirrorPropAsAssertion("neverCalledWithMatch", "expected %n to never be called with match %*%C");
    mirrorPropAsAssertion("threw", "%n did not throw exception%C");
    mirrorPropAsAssertion("alwaysThrew", "%n did not always throw exception%C");

    if (commonJSModule) {
        module.exports = assert;
    } else {
        sinon.assert = assert;
    }
}(typeof sinon == "object" && sinon || null, typeof window != "undefined" ? window : (typeof self != "undefined") ? self : global));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../sinon":5}],7:[function(require,module,exports){
(function (process){
/**
 * @depend ../sinon.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon, process, setImmediate, setTimeout*/
/**
 * Stub behavior
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Tim Fischbach (mail@timfischbach.de)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    var slice = Array.prototype.slice;
    var join = Array.prototype.join;
    var proto;

    var nextTick = (function () {
        if (typeof process === "object" && typeof process.nextTick === "function") {
            return process.nextTick;
        } else if (typeof setImmediate === "function") {
            return setImmediate;
        } else {
            return function (callback) {
                setTimeout(callback, 0);
            };
        }
    })();

    function throwsException(error, message) {
        if (typeof error == "string") {
            this.exception = new Error(message || "");
            this.exception.name = error;
        } else if (!error) {
            this.exception = new Error("Error");
        } else {
            this.exception = error;
        }

        return this;
    }

    function getCallback(behavior, args) {
        var callArgAt = behavior.callArgAt;

        if (callArgAt < 0) {
            var callArgProp = behavior.callArgProp;

            for (var i = 0, l = args.length; i < l; ++i) {
                if (!callArgProp && typeof args[i] == "function") {
                    return args[i];
                }

                if (callArgProp && args[i] &&
                    typeof args[i][callArgProp] == "function") {
                    return args[i][callArgProp];
                }
            }

            return null;
        }

        return args[callArgAt];
    }

    function getCallbackError(behavior, func, args) {
        if (behavior.callArgAt < 0) {
            var msg;

            if (behavior.callArgProp) {
                msg = sinon.functionName(behavior.stub) +
                    " expected to yield to '" + behavior.callArgProp +
                    "', but no object with such a property was passed.";
            } else {
                msg = sinon.functionName(behavior.stub) +
                    " expected to yield, but no callback was passed.";
            }

            if (args.length > 0) {
                msg += " Received [" + join.call(args, ", ") + "]";
            }

            return msg;
        }

        return "argument at index " + behavior.callArgAt + " is not a function: " + func;
    }

    function callCallback(behavior, args) {
        if (typeof behavior.callArgAt == "number") {
            var func = getCallback(behavior, args);

            if (typeof func != "function") {
                throw new TypeError(getCallbackError(behavior, func, args));
            }

            if (behavior.callbackAsync) {
                nextTick(function() {
                    func.apply(behavior.callbackContext, behavior.callbackArguments);
                });
            } else {
                func.apply(behavior.callbackContext, behavior.callbackArguments);
            }
        }
    }

    proto = {
        create: function(stub) {
            var behavior = sinon.extend({}, sinon.behavior);
            delete behavior.create;
            behavior.stub = stub;

            return behavior;
        },

        isPresent: function() {
            return (typeof this.callArgAt == 'number' ||
                    this.exception ||
                    typeof this.returnArgAt == 'number' ||
                    this.returnThis ||
                    this.returnValueDefined);
        },

        invoke: function(context, args) {
            callCallback(this, args);

            if (this.exception) {
                throw this.exception;
            } else if (typeof this.returnArgAt == 'number') {
                return args[this.returnArgAt];
            } else if (this.returnThis) {
                return context;
            }

            return this.returnValue;
        },

        onCall: function(index) {
            return this.stub.onCall(index);
        },

        onFirstCall: function() {
            return this.stub.onFirstCall();
        },

        onSecondCall: function() {
            return this.stub.onSecondCall();
        },

        onThirdCall: function() {
            return this.stub.onThirdCall();
        },

        withArgs: function(/* arguments */) {
            throw new Error('Defining a stub by invoking "stub.onCall(...).withArgs(...)" is not supported. ' +
                            'Use "stub.withArgs(...).onCall(...)" to define sequential behavior for calls with certain arguments.');
        },

        callsArg: function callsArg(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.callArgAt = pos;
            this.callbackArguments = [];
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgOn: function callsArgOn(pos, context) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = pos;
            this.callbackArguments = [];
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgWith: function callsArgWith(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.callArgAt = pos;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        callsArgOnWith: function callsArgWith(pos, context) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = pos;
            this.callbackArguments = slice.call(arguments, 2);
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yields: function () {
            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 0);
            this.callbackContext = undefined;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yieldsOn: function (context) {
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = context;
            this.callArgProp = undefined;
            this.callbackAsync = false;

            return this;
        },

        yieldsTo: function (prop) {
            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 1);
            this.callbackContext = undefined;
            this.callArgProp = prop;
            this.callbackAsync = false;

            return this;
        },

        yieldsToOn: function (prop, context) {
            if (typeof context != "object") {
                throw new TypeError("argument context is not an object");
            }

            this.callArgAt = -1;
            this.callbackArguments = slice.call(arguments, 2);
            this.callbackContext = context;
            this.callArgProp = prop;
            this.callbackAsync = false;

            return this;
        },


        "throws": throwsException,
        throwsException: throwsException,

        returns: function returns(value) {
            this.returnValue = value;
            this.returnValueDefined = true;

            return this;
        },

        returnsArg: function returnsArg(pos) {
            if (typeof pos != "number") {
                throw new TypeError("argument index is not number");
            }

            this.returnArgAt = pos;

            return this;
        },

        returnsThis: function returnsThis() {
            this.returnThis = true;

            return this;
        }
    };

    // create asynchronous versions of callsArg* and yields* methods
    for (var method in proto) {
        // need to avoid creating anotherasync versions of the newly added async methods
        if (proto.hasOwnProperty(method) &&
            method.match(/^(callsArg|yields)/) &&
            !method.match(/Async/)) {
            proto[method + 'Async'] = (function (syncFnName) {
                return function () {
                    var result = this[syncFnName].apply(this, arguments);
                    this.callbackAsync = true;
                    return result;
                };
            })(method);
        }
    }

    if (commonJSModule) {
        module.exports = proto;
    } else {
        sinon.behavior = proto;
    }
}(typeof sinon == "object" && sinon || null));
}).call(this,require("JkpR2F"))
},{"../sinon":5,"JkpR2F":2}],8:[function(require,module,exports){
/**
  * @depend ../sinon.js
  * @depend match.js
  */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
  * Spy calls
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @author Maximilian Antoni (mail@maxantoni.de)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  * Copyright (c) 2013 Maximilian Antoni
  */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function throwYieldError(proxy, text, args) {
        var msg = sinon.functionName(proxy) + text;
        if (args.length) {
            msg += " Received [" + slice.call(args).join(", ") + "]";
        }
        throw new Error(msg);
    }

    var slice = Array.prototype.slice;

    var callProto = {
        calledOn: function calledOn(thisValue) {
            if (sinon.match && sinon.match.isMatcher(thisValue)) {
                return thisValue.test(this.thisValue);
            }
            return this.thisValue === thisValue;
        },

        calledWith: function calledWith() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
                if (!sinon.deepEqual(arguments[i], this.args[i])) {
                    return false;
                }
            }

            return true;
        },

        calledWithMatch: function calledWithMatch() {
            for (var i = 0, l = arguments.length; i < l; i += 1) {
                var actual = this.args[i];
                var expectation = arguments[i];
                if (!sinon.match || !sinon.match(expectation).test(actual)) {
                    return false;
                }
            }
            return true;
        },

        calledWithExactly: function calledWithExactly() {
            return arguments.length == this.args.length &&
                this.calledWith.apply(this, arguments);
        },

        notCalledWith: function notCalledWith() {
            return !this.calledWith.apply(this, arguments);
        },

        notCalledWithMatch: function notCalledWithMatch() {
            return !this.calledWithMatch.apply(this, arguments);
        },

        returned: function returned(value) {
            return sinon.deepEqual(value, this.returnValue);
        },

        threw: function threw(error) {
            if (typeof error === "undefined" || !this.exception) {
                return !!this.exception;
            }

            return this.exception === error || this.exception.name === error;
        },

        calledWithNew: function calledWithNew() {
            return this.proxy.prototype && this.thisValue instanceof this.proxy;
        },

        calledBefore: function (other) {
            return this.callId < other.callId;
        },

        calledAfter: function (other) {
            return this.callId > other.callId;
        },

        callArg: function (pos) {
            this.args[pos]();
        },

        callArgOn: function (pos, thisValue) {
            this.args[pos].apply(thisValue);
        },

        callArgWith: function (pos) {
            this.callArgOnWith.apply(this, [pos, null].concat(slice.call(arguments, 1)));
        },

        callArgOnWith: function (pos, thisValue) {
            var args = slice.call(arguments, 2);
            this.args[pos].apply(thisValue, args);
        },

        "yield": function () {
            this.yieldOn.apply(this, [null].concat(slice.call(arguments, 0)));
        },

        yieldOn: function (thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
                if (typeof args[i] === "function") {
                    args[i].apply(thisValue, slice.call(arguments, 1));
                    return;
                }
            }
            throwYieldError(this.proxy, " cannot yield since no callback was passed.", args);
        },

        yieldTo: function (prop) {
            this.yieldToOn.apply(this, [prop, null].concat(slice.call(arguments, 1)));
        },

        yieldToOn: function (prop, thisValue) {
            var args = this.args;
            for (var i = 0, l = args.length; i < l; ++i) {
                if (args[i] && typeof args[i][prop] === "function") {
                    args[i][prop].apply(thisValue, slice.call(arguments, 2));
                    return;
                }
            }
            throwYieldError(this.proxy, " cannot yield to '" + prop +
                "' since no callback was passed.", args);
        },

        toString: function () {
            var callStr = this.proxy.toString() + "(";
            var args = [];

            for (var i = 0, l = this.args.length; i < l; ++i) {
                args.push(sinon.format(this.args[i]));
            }

            callStr = callStr + args.join(", ") + ")";

            if (typeof this.returnValue != "undefined") {
                callStr += " => " + sinon.format(this.returnValue);
            }

            if (this.exception) {
                callStr += " !" + this.exception.name;

                if (this.exception.message) {
                    callStr += "(" + this.exception.message + ")";
                }
            }

            return callStr;
        }
    };

    callProto.invokeCallback = callProto.yield;

    function createSpyCall(spy, thisValue, args, returnValue, exception, id) {
        if (typeof id !== "number") {
            throw new TypeError("Call id is not a number");
        }
        var proxyCall = sinon.create(callProto);
        proxyCall.proxy = spy;
        proxyCall.thisValue = thisValue;
        proxyCall.args = args;
        proxyCall.returnValue = returnValue;
        proxyCall.exception = exception;
        proxyCall.callId = id;

        return proxyCall;
    }
    createSpyCall.toString = callProto.toString; // used by mocks

    if (commonJSModule) {
        module.exports = createSpyCall;
    } else {
        sinon.spyCall = createSpyCall;
    }
}(typeof sinon == "object" && sinon || null));


},{"../sinon":5}],9:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true*/
/*global module, require, sinon*/
/**
 * Collections of stubs, spies and mocks.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    var push = [].push;
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function getFakes(fakeCollection) {
        if (!fakeCollection.fakes) {
            fakeCollection.fakes = [];
        }

        return fakeCollection.fakes;
    }

    function each(fakeCollection, method) {
        var fakes = getFakes(fakeCollection);

        for (var i = 0, l = fakes.length; i < l; i += 1) {
            if (typeof fakes[i][method] == "function") {
                fakes[i][method]();
            }
        }
    }

    function compact(fakeCollection) {
        var fakes = getFakes(fakeCollection);
        var i = 0;
        while (i < fakes.length) {
          fakes.splice(i, 1);
        }
    }

    var collection = {
        verify: function resolve() {
            each(this, "verify");
        },

        restore: function restore() {
            each(this, "restore");
            compact(this);
        },

        verifyAndRestore: function verifyAndRestore() {
            var exception;

            try {
                this.verify();
            } catch (e) {
                exception = e;
            }

            this.restore();

            if (exception) {
                throw exception;
            }
        },

        add: function add(fake) {
            push.call(getFakes(this), fake);
            return fake;
        },

        spy: function spy() {
            return this.add(sinon.spy.apply(sinon, arguments));
        },

        stub: function stub(object, property, value) {
            if (property) {
                var original = object[property];

                if (typeof original != "function") {
                    if (!hasOwnProperty.call(object, property)) {
                        throw new TypeError("Cannot stub non-existent own property " + property);
                    }

                    object[property] = value;

                    return this.add({
                        restore: function () {
                            object[property] = original;
                        }
                    });
                }
            }
            if (!property && !!object && typeof object == "object") {
                var stubbedObj = sinon.stub.apply(sinon, arguments);

                for (var prop in stubbedObj) {
                    if (typeof stubbedObj[prop] === "function") {
                        this.add(stubbedObj[prop]);
                    }
                }

                return stubbedObj;
            }

            return this.add(sinon.stub.apply(sinon, arguments));
        },

        mock: function mock() {
            return this.add(sinon.mock.apply(sinon, arguments));
        },

        inject: function inject(obj) {
            var col = this;

            obj.spy = function () {
                return col.spy.apply(col, arguments);
            };

            obj.stub = function () {
                return col.stub.apply(col, arguments);
            };

            obj.mock = function () {
                return col.mock.apply(col, arguments);
            };

            return obj;
        }
    };

    if (commonJSModule) {
        module.exports = collection;
    } else {
        sinon.collection = collection;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":5}],10:[function(require,module,exports){
/* @depend ../sinon.js */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
 * Match functions
 *
 * @author Maximilian Antoni (mail@maxantoni.de)
 * @license BSD
 *
 * Copyright (c) 2012 Maximilian Antoni
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function assertType(value, type, name) {
        var actual = sinon.typeOf(value);
        if (actual !== type) {
            throw new TypeError("Expected type of " + name + " to be " +
                type + ", but was " + actual);
        }
    }

    var matcher = {
        toString: function () {
            return this.message;
        }
    };

    function isMatcher(object) {
        return matcher.isPrototypeOf(object);
    }

    function matchObject(expectation, actual) {
        if (actual === null || actual === undefined) {
            return false;
        }
        for (var key in expectation) {
            if (expectation.hasOwnProperty(key)) {
                var exp = expectation[key];
                var act = actual[key];
                if (match.isMatcher(exp)) {
                    if (!exp.test(act)) {
                        return false;
                    }
                } else if (sinon.typeOf(exp) === "object") {
                    if (!matchObject(exp, act)) {
                        return false;
                    }
                } else if (!sinon.deepEqual(exp, act)) {
                    return false;
                }
            }
        }
        return true;
    }

    matcher.or = function (m2) {
        if (!isMatcher(m2)) {
            throw new TypeError("Matcher expected");
        }
        var m1 = this;
        var or = sinon.create(matcher);
        or.test = function (actual) {
            return m1.test(actual) || m2.test(actual);
        };
        or.message = m1.message + ".or(" + m2.message + ")";
        return or;
    };

    matcher.and = function (m2) {
        if (!isMatcher(m2)) {
            throw new TypeError("Matcher expected");
        }
        var m1 = this;
        var and = sinon.create(matcher);
        and.test = function (actual) {
            return m1.test(actual) && m2.test(actual);
        };
        and.message = m1.message + ".and(" + m2.message + ")";
        return and;
    };

    var match = function (expectation, message) {
        var m = sinon.create(matcher);
        var type = sinon.typeOf(expectation);
        switch (type) {
        case "object":
            if (typeof expectation.test === "function") {
                m.test = function (actual) {
                    return expectation.test(actual) === true;
                };
                m.message = "match(" + sinon.functionName(expectation.test) + ")";
                return m;
            }
            var str = [];
            for (var key in expectation) {
                if (expectation.hasOwnProperty(key)) {
                    str.push(key + ": " + expectation[key]);
                }
            }
            m.test = function (actual) {
                return matchObject(expectation, actual);
            };
            m.message = "match(" + str.join(", ") + ")";
            break;
        case "number":
            m.test = function (actual) {
                return expectation == actual;
            };
            break;
        case "string":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return actual.indexOf(expectation) !== -1;
            };
            m.message = "match(\"" + expectation + "\")";
            break;
        case "regexp":
            m.test = function (actual) {
                if (typeof actual !== "string") {
                    return false;
                }
                return expectation.test(actual);
            };
            break;
        case "function":
            m.test = expectation;
            if (message) {
                m.message = message;
            } else {
                m.message = "match(" + sinon.functionName(expectation) + ")";
            }
            break;
        default:
            m.test = function (actual) {
              return sinon.deepEqual(expectation, actual);
            };
        }
        if (!m.message) {
            m.message = "match(" + expectation + ")";
        }
        return m;
    };

    match.isMatcher = isMatcher;

    match.any = match(function () {
        return true;
    }, "any");

    match.defined = match(function (actual) {
        return actual !== null && actual !== undefined;
    }, "defined");

    match.truthy = match(function (actual) {
        return !!actual;
    }, "truthy");

    match.falsy = match(function (actual) {
        return !actual;
    }, "falsy");

    match.same = function (expectation) {
        return match(function (actual) {
            return expectation === actual;
        }, "same(" + expectation + ")");
    };

    match.typeOf = function (type) {
        assertType(type, "string", "type");
        return match(function (actual) {
            return sinon.typeOf(actual) === type;
        }, "typeOf(\"" + type + "\")");
    };

    match.instanceOf = function (type) {
        assertType(type, "function", "type");
        return match(function (actual) {
            return actual instanceof type;
        }, "instanceOf(" + sinon.functionName(type) + ")");
    };

    function createPropertyMatcher(propertyTest, messagePrefix) {
        return function (property, value) {
            assertType(property, "string", "property");
            var onlyProperty = arguments.length === 1;
            var message = messagePrefix + "(\"" + property + "\"";
            if (!onlyProperty) {
                message += ", " + value;
            }
            message += ")";
            return match(function (actual) {
                if (actual === undefined || actual === null ||
                        !propertyTest(actual, property)) {
                    return false;
                }
                return onlyProperty || sinon.deepEqual(value, actual[property]);
            }, message);
        };
    }

    match.has = createPropertyMatcher(function (actual, property) {
        if (typeof actual === "object") {
            return property in actual;
        }
        return actual[property] !== undefined;
    }, "has");

    match.hasOwn = createPropertyMatcher(function (actual, property) {
        return actual.hasOwnProperty(property);
    }, "hasOwn");

    match.bool = match.typeOf("boolean");
    match.number = match.typeOf("number");
    match.string = match.typeOf("string");
    match.object = match.typeOf("object");
    match.func = match.typeOf("function");
    match.array = match.typeOf("array");
    match.regexp = match.typeOf("regexp");
    match.date = match.typeOf("date");

    if (commonJSModule) {
        module.exports = match;
    } else {
        sinon.match = match;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":5}],11:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 */
/*jslint eqeqeq: false, onevar: false, nomen: false*/
/*global module, require, sinon*/
/**
 * Mock functions.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    var push = [].push;
    var match;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    match = sinon.match;

    if (!match && commonJSModule) {
        match = require("./match");
    }

    function mock(object) {
        if (!object) {
            return sinon.expectation.create("Anonymous mock");
        }

        return mock.create(object);
    }

    sinon.mock = mock;

    sinon.extend(mock, (function () {
        function each(collection, callback) {
            if (!collection) {
                return;
            }

            for (var i = 0, l = collection.length; i < l; i += 1) {
                callback(collection[i]);
            }
        }

        return {
            create: function create(object) {
                if (!object) {
                    throw new TypeError("object is null");
                }

                var mockObject = sinon.extend({}, mock);
                mockObject.object = object;
                delete mockObject.create;

                return mockObject;
            },

            expects: function expects(method) {
                if (!method) {
                    throw new TypeError("method is falsy");
                }

                if (!this.expectations) {
                    this.expectations = {};
                    this.proxies = [];
                }

                if (!this.expectations[method]) {
                    this.expectations[method] = [];
                    var mockObject = this;

                    sinon.wrapMethod(this.object, method, function () {
                        return mockObject.invokeMethod(method, this, arguments);
                    });

                    push.call(this.proxies, method);
                }

                var expectation = sinon.expectation.create(method);
                push.call(this.expectations[method], expectation);

                return expectation;
            },

            restore: function restore() {
                var object = this.object;

                each(this.proxies, function (proxy) {
                    if (typeof object[proxy].restore == "function") {
                        object[proxy].restore();
                    }
                });
            },

            verify: function verify() {
                var expectations = this.expectations || {};
                var messages = [], met = [];

                each(this.proxies, function (proxy) {
                    each(expectations[proxy], function (expectation) {
                        if (!expectation.met()) {
                            push.call(messages, expectation.toString());
                        } else {
                            push.call(met, expectation.toString());
                        }
                    });
                });

                this.restore();

                if (messages.length > 0) {
                    sinon.expectation.fail(messages.concat(met).join("\n"));
                } else {
                    sinon.expectation.pass(messages.concat(met).join("\n"));
                }

                return true;
            },

            invokeMethod: function invokeMethod(method, thisValue, args) {
                var expectations = this.expectations && this.expectations[method];
                var length = expectations && expectations.length || 0, i;

                for (i = 0; i < length; i += 1) {
                    if (!expectations[i].met() &&
                        expectations[i].allowsCall(thisValue, args)) {
                        return expectations[i].apply(thisValue, args);
                    }
                }

                var messages = [], available, exhausted = 0;

                for (i = 0; i < length; i += 1) {
                    if (expectations[i].allowsCall(thisValue, args)) {
                        available = available || expectations[i];
                    } else {
                        exhausted += 1;
                    }
                    push.call(messages, "    " + expectations[i].toString());
                }

                if (exhausted === 0) {
                    return available.apply(thisValue, args);
                }

                messages.unshift("Unexpected call: " + sinon.spyCall.toString.call({
                    proxy: method,
                    args: args
                }));

                sinon.expectation.fail(messages.join("\n"));
            }
        };
    }()));

    var times = sinon.timesInWords;

    sinon.expectation = (function () {
        var slice = Array.prototype.slice;
        var _invoke = sinon.spy.invoke;

        function callCountInWords(callCount) {
            if (callCount == 0) {
                return "never called";
            } else {
                return "called " + times(callCount);
            }
        }

        function expectedCallCountInWords(expectation) {
            var min = expectation.minCalls;
            var max = expectation.maxCalls;

            if (typeof min == "number" && typeof max == "number") {
                var str = times(min);

                if (min != max) {
                    str = "at least " + str + " and at most " + times(max);
                }

                return str;
            }

            if (typeof min == "number") {
                return "at least " + times(min);
            }

            return "at most " + times(max);
        }

        function receivedMinCalls(expectation) {
            var hasMinLimit = typeof expectation.minCalls == "number";
            return !hasMinLimit || expectation.callCount >= expectation.minCalls;
        }

        function receivedMaxCalls(expectation) {
            if (typeof expectation.maxCalls != "number") {
                return false;
            }

            return expectation.callCount == expectation.maxCalls;
        }

        function verifyMatcher(possibleMatcher, arg){
            if (match && match.isMatcher(possibleMatcher)) {
                return possibleMatcher.test(arg);
            } else {
                return true;
            }
        }

        return {
            minCalls: 1,
            maxCalls: 1,

            create: function create(methodName) {
                var expectation = sinon.extend(sinon.stub.create(), sinon.expectation);
                delete expectation.create;
                expectation.method = methodName;

                return expectation;
            },

            invoke: function invoke(func, thisValue, args) {
                this.verifyCallAllowed(thisValue, args);

                return _invoke.apply(this, arguments);
            },

            atLeast: function atLeast(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.maxCalls = null;
                    this.limitsSet = true;
                }

                this.minCalls = num;

                return this;
            },

            atMost: function atMost(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not number");
                }

                if (!this.limitsSet) {
                    this.minCalls = null;
                    this.limitsSet = true;
                }

                this.maxCalls = num;

                return this;
            },

            never: function never() {
                return this.exactly(0);
            },

            once: function once() {
                return this.exactly(1);
            },

            twice: function twice() {
                return this.exactly(2);
            },

            thrice: function thrice() {
                return this.exactly(3);
            },

            exactly: function exactly(num) {
                if (typeof num != "number") {
                    throw new TypeError("'" + num + "' is not a number");
                }

                this.atLeast(num);
                return this.atMost(num);
            },

            met: function met() {
                return !this.failed && receivedMinCalls(this);
            },

            verifyCallAllowed: function verifyCallAllowed(thisValue, args) {
                if (receivedMaxCalls(this)) {
                    this.failed = true;
                    sinon.expectation.fail(this.method + " already called " + times(this.maxCalls));
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    sinon.expectation.fail(this.method + " called with " + thisValue + " as thisValue, expected " +
                        this.expectedThis);
                }

                if (!("expectedArguments" in this)) {
                    return;
                }

                if (!args) {
                    sinon.expectation.fail(this.method + " received no arguments, expected " +
                        sinon.format(this.expectedArguments));
                }

                if (args.length < this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too few arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    sinon.expectation.fail(this.method + " received too many arguments (" + sinon.format(args) +
                        "), expected " + sinon.format(this.expectedArguments));
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {

                    if (!verifyMatcher(this.expectedArguments[i],args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", didn't match " + this.expectedArguments.toString());
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        sinon.expectation.fail(this.method + " received wrong arguments " + sinon.format(args) +
                            ", expected " + sinon.format(this.expectedArguments));
                    }
                }
            },

            allowsCall: function allowsCall(thisValue, args) {
                if (this.met() && receivedMaxCalls(this)) {
                    return false;
                }

                if ("expectedThis" in this && this.expectedThis !== thisValue) {
                    return false;
                }

                if (!("expectedArguments" in this)) {
                    return true;
                }

                args = args || [];

                if (args.length < this.expectedArguments.length) {
                    return false;
                }

                if (this.expectsExactArgCount &&
                    args.length != this.expectedArguments.length) {
                    return false;
                }

                for (var i = 0, l = this.expectedArguments.length; i < l; i += 1) {
                    if (!verifyMatcher(this.expectedArguments[i],args[i])) {
                        return false;
                    }

                    if (!sinon.deepEqual(this.expectedArguments[i], args[i])) {
                        return false;
                    }
                }

                return true;
            },

            withArgs: function withArgs() {
                this.expectedArguments = slice.call(arguments);
                return this;
            },

            withExactArgs: function withExactArgs() {
                this.withArgs.apply(this, arguments);
                this.expectsExactArgCount = true;
                return this;
            },

            on: function on(thisValue) {
                this.expectedThis = thisValue;
                return this;
            },

            toString: function () {
                var args = (this.expectedArguments || []).slice();

                if (!this.expectsExactArgCount) {
                    push.call(args, "[...]");
                }

                var callStr = sinon.spyCall.toString.call({
                    proxy: this.method || "anonymous mock expectation",
                    args: args
                });

                var message = callStr.replace(", [...", "[, ...") + " " +
                    expectedCallCountInWords(this);

                if (this.met()) {
                    return "Expectation met: " + message;
                }

                return "Expected " + message + " (" +
                    callCountInWords(this.callCount) + ")";
            },

            verify: function verify() {
                if (!this.met()) {
                    sinon.expectation.fail(this.toString());
                } else {
                    sinon.expectation.pass(this.toString());
                }

                return true;
            },

            pass: function(message) {
              sinon.assert.pass(message);
            },
            fail: function (message) {
                var exception = new Error(message);
                exception.name = "ExpectationError";

                throw exception;
            }
        };
    }());

    if (commonJSModule) {
        module.exports = mock;
    } else {
        sinon.mock = mock;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":5,"./match":10}],12:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend collection.js
 * @depend util/fake_timers.js
 * @depend util/fake_server_with_clock.js
 */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global require, module*/
/**
 * Manages fake collections as well as fake utilities such as Sinon's
 * timers and fake XHR implementation in one convenient object.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

if (typeof module !== 'undefined' && module.exports) {
    var sinon = require("../sinon");
    sinon.extend(sinon, require("./util/fake_timers"));
}

(function () {
    var push = [].push;

    function exposeValue(sandbox, config, key, value) {
        if (!value) {
            return;
        }

        if (config.injectInto && !(key in config.injectInto) ) {
            config.injectInto[key] = value;
        } else {
            push.call(sandbox.args, value);
        }
    }

    function prepareSandboxFromConfig(config) {
        var sandbox = sinon.create(sinon.sandbox);

        if (config.useFakeServer) {
            if (typeof config.useFakeServer == "object") {
                sandbox.serverPrototype = config.useFakeServer;
            }

            sandbox.useFakeServer();
        }

        if (config.useFakeTimers) {
            if (typeof config.useFakeTimers == "object") {
                sandbox.useFakeTimers.apply(sandbox, config.useFakeTimers);
            } else {
                sandbox.useFakeTimers();
            }
        }

        return sandbox;
    }

    sinon.sandbox = sinon.extend(sinon.create(sinon.collection), {
        useFakeTimers: function useFakeTimers() {
            this.clock = sinon.useFakeTimers.apply(sinon, arguments);

            return this.add(this.clock);
        },

        serverPrototype: sinon.fakeServer,

        useFakeServer: function useFakeServer() {
            var proto = this.serverPrototype || sinon.fakeServer;

            if (!proto || !proto.create) {
                return null;
            }

            this.server = proto.create();
            return this.add(this.server);
        },

        inject: function (obj) {
            sinon.collection.inject.call(this, obj);

            if (this.clock) {
                obj.clock = this.clock;
            }

            if (this.server) {
                obj.server = this.server;
                obj.requests = this.server.requests;
            }

            return obj;
        },

        create: function (config) {
            if (!config) {
                return sinon.create(sinon.sandbox);
            }

            var sandbox = prepareSandboxFromConfig(config);
            sandbox.args = sandbox.args || [];
            var prop, value, exposed = sandbox.inject({});

            if (config.properties) {
                for (var i = 0, l = config.properties.length; i < l; i++) {
                    prop = config.properties[i];
                    value = exposed[prop] || prop == "sandbox" && sandbox;
                    exposeValue(sandbox, config, prop, value);
                }
            } else {
                exposeValue(sandbox, config, "sandbox", value);
            }

            return sandbox;
        }
    });

    sinon.sandbox.useFakeXMLHttpRequest = sinon.sandbox.useFakeServer;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = sinon.sandbox;
    }
}());

},{"../sinon":5,"./util/fake_timers":17}],13:[function(require,module,exports){
/**
  * @depend ../sinon.js
  * @depend call.js
  */
/*jslint eqeqeq: false, onevar: false, plusplus: false*/
/*global module, require, sinon*/
/**
  * Spy functions
  *
  * @author Christian Johansen (christian@cjohansen.no)
  * @license BSD
  *
  * Copyright (c) 2010-2013 Christian Johansen
  */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;
    var push = Array.prototype.push;
    var slice = Array.prototype.slice;
    var callId = 0;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function spy(object, property) {
        if (!property && typeof object == "function") {
            return spy.create(object);
        }

        if (!object && !property) {
            return spy.create(function () { });
        }

        var method = object[property];
        return sinon.wrapMethod(object, property, spy.create(method));
    }

    function matchingFake(fakes, args, strict) {
        if (!fakes) {
            return;
        }

        for (var i = 0, l = fakes.length; i < l; i++) {
            if (fakes[i].matches(args, strict)) {
                return fakes[i];
            }
        }
    }

    function incrementCallCount() {
        this.called = true;
        this.callCount += 1;
        this.notCalled = false;
        this.calledOnce = this.callCount == 1;
        this.calledTwice = this.callCount == 2;
        this.calledThrice = this.callCount == 3;
    }

    function createCallProperties() {
        this.firstCall = this.getCall(0);
        this.secondCall = this.getCall(1);
        this.thirdCall = this.getCall(2);
        this.lastCall = this.getCall(this.callCount - 1);
    }

    var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
    function createProxy(func) {
        // Retain the function length:
        var p;
        if (func.length) {
            eval("p = (function proxy(" + vars.substring(0, func.length * 2 - 1) +
                ") { return p.invoke(func, this, slice.call(arguments)); });");
        }
        else {
            p = function proxy() {
                return p.invoke(func, this, slice.call(arguments));
            };
        }
        return p;
    }

    var uuid = 0;

    // Public API
    var spyApi = {
        reset: function () {
            this.called = false;
            this.notCalled = true;
            this.calledOnce = false;
            this.calledTwice = false;
            this.calledThrice = false;
            this.callCount = 0;
            this.firstCall = null;
            this.secondCall = null;
            this.thirdCall = null;
            this.lastCall = null;
            this.args = [];
            this.returnValues = [];
            this.thisValues = [];
            this.exceptions = [];
            this.callIds = [];
            if (this.fakes) {
                for (var i = 0; i < this.fakes.length; i++) {
                    this.fakes[i].reset();
                }
            }
        },

        create: function create(func) {
            var name;

            if (typeof func != "function") {
                func = function () { };
            } else {
                name = sinon.functionName(func);
            }

            var proxy = createProxy(func);

            sinon.extend(proxy, spy);
            delete proxy.create;
            sinon.extend(proxy, func);

            proxy.reset();
            proxy.prototype = func.prototype;
            proxy.displayName = name || "spy";
            proxy.toString = sinon.functionToString;
            proxy._create = sinon.spy.create;
            proxy.id = "spy#" + uuid++;

            return proxy;
        },

        invoke: function invoke(func, thisValue, args) {
            var matching = matchingFake(this.fakes, args);
            var exception, returnValue;

            incrementCallCount.call(this);
            push.call(this.thisValues, thisValue);
            push.call(this.args, args);
            push.call(this.callIds, callId++);

            try {
                if (matching) {
                    returnValue = matching.invoke(func, thisValue, args);
                } else {
                    returnValue = (this.func || func).apply(thisValue, args);
                }

                var thisCall = this.getCall(this.callCount - 1);
                if (thisCall.calledWithNew() && typeof returnValue !== 'object') {
                    returnValue = thisValue;
                }
            } catch (e) {
                exception = e;
            }

            push.call(this.exceptions, exception);
            push.call(this.returnValues, returnValue);

            createCallProperties.call(this);

            if (exception !== undefined) {
                throw exception;
            }

            return returnValue;
        },

        getCall: function getCall(i) {
            if (i < 0 || i >= this.callCount) {
                return null;
            }

            return sinon.spyCall(this, this.thisValues[i], this.args[i],
                                    this.returnValues[i], this.exceptions[i],
                                    this.callIds[i]);
        },

        getCalls: function () {
            var calls = [];
            var i;

            for (i = 0; i < this.callCount; i++) {
                calls.push(this.getCall(i));
            }

            return calls;
        },

        calledBefore: function calledBefore(spyFn) {
            if (!this.called) {
                return false;
            }

            if (!spyFn.called) {
                return true;
            }

            return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
        },

        calledAfter: function calledAfter(spyFn) {
            if (!this.called || !spyFn.called) {
                return false;
            }

            return this.callIds[this.callCount - 1] > spyFn.callIds[spyFn.callCount - 1];
        },

        withArgs: function () {
            var args = slice.call(arguments);

            if (this.fakes) {
                var match = matchingFake(this.fakes, args, true);

                if (match) {
                    return match;
                }
            } else {
                this.fakes = [];
            }

            var original = this;
            var fake = this._create();
            fake.matchingAguments = args;
            fake.parent = this;
            push.call(this.fakes, fake);

            fake.withArgs = function () {
                return original.withArgs.apply(original, arguments);
            };

            for (var i = 0; i < this.args.length; i++) {
                if (fake.matches(this.args[i])) {
                    incrementCallCount.call(fake);
                    push.call(fake.thisValues, this.thisValues[i]);
                    push.call(fake.args, this.args[i]);
                    push.call(fake.returnValues, this.returnValues[i]);
                    push.call(fake.exceptions, this.exceptions[i]);
                    push.call(fake.callIds, this.callIds[i]);
                }
            }
            createCallProperties.call(fake);

            return fake;
        },

        matches: function (args, strict) {
            var margs = this.matchingAguments;

            if (margs.length <= args.length &&
                sinon.deepEqual(margs, args.slice(0, margs.length))) {
                return !strict || margs.length == args.length;
            }
        },

        printf: function (format) {
            var spy = this;
            var args = slice.call(arguments, 1);
            var formatter;

            return (format || "").replace(/%(.)/g, function (match, specifyer) {
                formatter = spyApi.formatters[specifyer];

                if (typeof formatter == "function") {
                    return formatter.call(null, spy, args);
                } else if (!isNaN(parseInt(specifyer, 10))) {
                    return sinon.format(args[specifyer - 1]);
                }

                return "%" + specifyer;
            });
        }
    };

    function delegateToCalls(method, matchAny, actual, notCalled) {
        spyApi[method] = function () {
            if (!this.called) {
                if (notCalled) {
                    return notCalled.apply(this, arguments);
                }
                return false;
            }

            var currentCall;
            var matches = 0;

            for (var i = 0, l = this.callCount; i < l; i += 1) {
                currentCall = this.getCall(i);

                if (currentCall[actual || method].apply(currentCall, arguments)) {
                    matches += 1;

                    if (matchAny) {
                        return true;
                    }
                }
            }

            return matches === this.callCount;
        };
    }

    delegateToCalls("calledOn", true);
    delegateToCalls("alwaysCalledOn", false, "calledOn");
    delegateToCalls("calledWith", true);
    delegateToCalls("calledWithMatch", true);
    delegateToCalls("alwaysCalledWith", false, "calledWith");
    delegateToCalls("alwaysCalledWithMatch", false, "calledWithMatch");
    delegateToCalls("calledWithExactly", true);
    delegateToCalls("alwaysCalledWithExactly", false, "calledWithExactly");
    delegateToCalls("neverCalledWith", false, "notCalledWith",
        function () { return true; });
    delegateToCalls("neverCalledWithMatch", false, "notCalledWithMatch",
        function () { return true; });
    delegateToCalls("threw", true);
    delegateToCalls("alwaysThrew", false, "threw");
    delegateToCalls("returned", true);
    delegateToCalls("alwaysReturned", false, "returned");
    delegateToCalls("calledWithNew", true);
    delegateToCalls("alwaysCalledWithNew", false, "calledWithNew");
    delegateToCalls("callArg", false, "callArgWith", function () {
        throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
    });
    spyApi.callArgWith = spyApi.callArg;
    delegateToCalls("callArgOn", false, "callArgOnWith", function () {
        throw new Error(this.toString() + " cannot call arg since it was not yet invoked.");
    });
    spyApi.callArgOnWith = spyApi.callArgOn;
    delegateToCalls("yield", false, "yield", function () {
        throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
    });
    // "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
    spyApi.invokeCallback = spyApi.yield;
    delegateToCalls("yieldOn", false, "yieldOn", function () {
        throw new Error(this.toString() + " cannot yield since it was not yet invoked.");
    });
    delegateToCalls("yieldTo", false, "yieldTo", function (property) {
        throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
    });
    delegateToCalls("yieldToOn", false, "yieldToOn", function (property) {
        throw new Error(this.toString() + " cannot yield to '" + property +
            "' since it was not yet invoked.");
    });

    spyApi.formatters = {
        "c": function (spy) {
            return sinon.timesInWords(spy.callCount);
        },

        "n": function (spy) {
            return spy.toString();
        },

        "C": function (spy) {
            var calls = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
                var stringifiedCall = "    " + spy.getCall(i).toString();
                if (/\n/.test(calls[i - 1])) {
                    stringifiedCall = "\n" + stringifiedCall;
                }
                push.call(calls, stringifiedCall);
            }

            return calls.length > 0 ? "\n" + calls.join("\n") : "";
        },

        "t": function (spy) {
            var objects = [];

            for (var i = 0, l = spy.callCount; i < l; ++i) {
                push.call(objects, sinon.format(spy.thisValues[i]));
            }

            return objects.join(", ");
        },

        "*": function (spy, args) {
            var formatted = [];

            for (var i = 0, l = args.length; i < l; ++i) {
                push.call(formatted, sinon.format(args[i]));
            }

            return formatted.join(", ");
        }
    };

    sinon.extend(spy, spyApi);

    spy.spyCall = sinon.spyCall;

    if (commonJSModule) {
        module.exports = spy;
    } else {
        sinon.spy = spy;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":5}],14:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend spy.js
 * @depend behavior.js
 */
/*jslint eqeqeq: false, onevar: false*/
/*global module, require, sinon*/
/**
 * Stub functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function stub(object, property, func) {
        if (!!func && typeof func != "function") {
            throw new TypeError("Custom stub should be function");
        }

        var wrapper;

        if (func) {
            wrapper = sinon.spy && sinon.spy.create ? sinon.spy.create(func) : func;
        } else {
            wrapper = stub.create();
        }

        if (!object && typeof property === "undefined") {
            return sinon.stub.create();
        }

        if (typeof property === "undefined" && typeof object == "object") {
            for (var prop in object) {
                if (typeof object[prop] === "function") {
                    stub(object, prop);
                }
            }

            return object;
        }

        return sinon.wrapMethod(object, property, wrapper);
    }

    function getDefaultBehavior(stub) {
        return stub.defaultBehavior || getParentBehaviour(stub) || sinon.behavior.create(stub);
    }

    function getParentBehaviour(stub) {
        return (stub.parent && getCurrentBehavior(stub.parent));
    }

    function getCurrentBehavior(stub) {
        var behavior = stub.behaviors[stub.callCount - 1];
        return behavior && behavior.isPresent() ? behavior : getDefaultBehavior(stub);
    }

    var uuid = 0;

    sinon.extend(stub, (function () {
        var proto = {
            create: function create() {
                var functionStub = function () {
                    return getCurrentBehavior(functionStub).invoke(this, arguments);
                };

                functionStub.id = "stub#" + uuid++;
                var orig = functionStub;
                functionStub = sinon.spy.create(functionStub);
                functionStub.func = orig;

                sinon.extend(functionStub, stub);
                functionStub._create = sinon.stub.create;
                functionStub.displayName = "stub";
                functionStub.toString = sinon.functionToString;

                functionStub.defaultBehavior = null;
                functionStub.behaviors = [];

                return functionStub;
            },

            resetBehavior: function () {
                var i;

                this.defaultBehavior = null;
                this.behaviors = [];

                delete this.returnValue;
                delete this.returnArgAt;
                this.returnThis = false;

                if (this.fakes) {
                    for (i = 0; i < this.fakes.length; i++) {
                        this.fakes[i].resetBehavior();
                    }
                }
            },

            onCall: function(index) {
                if (!this.behaviors[index]) {
                    this.behaviors[index] = sinon.behavior.create(this);
                }

                return this.behaviors[index];
            },

            onFirstCall: function() {
                return this.onCall(0);
            },

            onSecondCall: function() {
                return this.onCall(1);
            },

            onThirdCall: function() {
                return this.onCall(2);
            }
        };

        for (var method in sinon.behavior) {
            if (sinon.behavior.hasOwnProperty(method) &&
                !proto.hasOwnProperty(method) &&
                method != 'create' &&
                method != 'withArgs' &&
                method != 'invoke') {
                proto[method] = (function(behaviorMethod) {
                    return function() {
                        this.defaultBehavior = this.defaultBehavior || sinon.behavior.create(this);
                        this.defaultBehavior[behaviorMethod].apply(this.defaultBehavior, arguments);
                        return this;
                    };
                }(method));
            }
        }

        return proto;
    }()));

    if (commonJSModule) {
        module.exports = stub;
    } else {
        sinon.stub = stub;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":5}],15:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend stub.js
 * @depend mock.js
 * @depend sandbox.js
 */
/*jslint eqeqeq: false, onevar: false, forin: true, plusplus: false*/
/*global module, require, sinon*/
/**
 * Test function, sandboxes fakes
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon) {
        return;
    }

    function test(callback) {
        var type = typeof callback;

        if (type != "function") {
            throw new TypeError("sinon.test needs to wrap a test function, got " + type);
        }

        return function () {
            var config = sinon.getConfig(sinon.config);
            config.injectInto = config.injectIntoThis && this || config.injectInto;
            var sandbox = sinon.sandbox.create(config);
            var exception, result;
            var args = Array.prototype.slice.call(arguments).concat(sandbox.args);

            try {
                result = callback.apply(this, args);
            } catch (e) {
                exception = e;
            }

            if (typeof exception !== "undefined") {
                sandbox.restore();
                throw exception;
            }
            else {
                sandbox.verifyAndRestore();
            }

            return result;
        };
    }

    test.config = {
        injectIntoThis: true,
        injectInto: null,
        properties: ["spy", "stub", "mock", "clock", "server", "requests"],
        useFakeTimers: true,
        useFakeServer: true
    };

    if (commonJSModule) {
        module.exports = test;
    } else {
        sinon.test = test;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":5}],16:[function(require,module,exports){
/**
 * @depend ../sinon.js
 * @depend test.js
 */
/*jslint eqeqeq: false, onevar: false, eqeqeq: false*/
/*global module, require, sinon*/
/**
 * Test case, sandboxes all test functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

(function (sinon) {
    var commonJSModule = typeof module !== 'undefined' && module.exports;

    if (!sinon && commonJSModule) {
        sinon = require("../sinon");
    }

    if (!sinon || !Object.prototype.hasOwnProperty) {
        return;
    }

    function createTest(property, setUp, tearDown) {
        return function () {
            if (setUp) {
                setUp.apply(this, arguments);
            }

            var exception, result;

            try {
                result = property.apply(this, arguments);
            } catch (e) {
                exception = e;
            }

            if (tearDown) {
                tearDown.apply(this, arguments);
            }

            if (exception) {
                throw exception;
            }

            return result;
        };
    }

    function testCase(tests, prefix) {
        /*jsl:ignore*/
        if (!tests || typeof tests != "object") {
            throw new TypeError("sinon.testCase needs an object with test functions");
        }
        /*jsl:end*/

        prefix = prefix || "test";
        var rPrefix = new RegExp("^" + prefix);
        var methods = {}, testName, property, method;
        var setUp = tests.setUp;
        var tearDown = tests.tearDown;

        for (testName in tests) {
            if (tests.hasOwnProperty(testName)) {
                property = tests[testName];

                if (/^(setUp|tearDown)$/.test(testName)) {
                    continue;
                }

                if (typeof property == "function" && rPrefix.test(testName)) {
                    method = property;

                    if (setUp || tearDown) {
                        method = createTest(property, setUp, tearDown);
                    }

                    methods[testName] = sinon.test(method);
                } else {
                    methods[testName] = tests[testName];
                }
            }
        }

        return methods;
    }

    if (commonJSModule) {
        module.exports = testCase;
    } else {
        sinon.testCase = testCase;
    }
}(typeof sinon == "object" && sinon || null));

},{"../sinon":5}],17:[function(require,module,exports){
(function (global){
/*jslint eqeqeq: false, plusplus: false, evil: true, onevar: false, browser: true, forin: false*/
/*global module, require, window*/
/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
"use strict";

if (typeof sinon == "undefined") {
    var sinon = {};
}

(function (global) {
    var id = 1;

    function addTimer(args, recurring) {
        if (args.length === 0) {
            throw new Error("Function requires at least 1 parameter");
        }

        if (typeof args[0] === "undefined") {
            throw new Error("Callback must be provided to timer calls");
        }

        var toId = id++;
        var delay = args[1] || 0;

        if (!this.timeouts) {
            this.timeouts = {};
        }

        this.timeouts[toId] = {
            id: toId,
            func: args[0],
            callAt: this.now + delay,
            invokeArgs: Array.prototype.slice.call(args, 2)
        };

        if (recurring === true) {
            this.timeouts[toId].interval = delay;
        }

        return toId;
    }

    function parseTime(str) {
        if (!str) {
            return 0;
        }

        var strings = str.split(":");
        var l = strings.length, i = l;
        var ms = 0, parsed;

        if (l > 3 || !/^(\d\d:){0,2}\d\d?$/.test(str)) {
            throw new Error("tick only understands numbers and 'h:m:s'");
        }

        while (i--) {
            parsed = parseInt(strings[i], 10);

            if (parsed >= 60) {
                throw new Error("Invalid time " + str);
            }

            ms += parsed * Math.pow(60, (l - i - 1));
        }

        return ms * 1000;
    }

    function createObject(object) {
        var newObject;

        if (Object.create) {
            newObject = Object.create(object);
        } else {
            var F = function () {};
            F.prototype = object;
            newObject = new F();
        }

        newObject.Date.clock = newObject;
        return newObject;
    }

    sinon.clock = {
        now: 0,

        create: function create(now) {
            var clock = createObject(this);

            if (typeof now == "number") {
                clock.now = now;
            }

            if (!!now && typeof now == "object") {
                throw new TypeError("now should be milliseconds since UNIX epoch");
            }

            return clock;
        },

        setTimeout: function setTimeout(callback, timeout) {
            return addTimer.call(this, arguments, false);
        },

        clearTimeout: function clearTimeout(timerId) {
            if (!this.timeouts) {
                this.timeouts = [];
            }

            if (timerId in this.timeouts) {
                delete this.timeouts[timerId];
            }
        },

        setInterval: function setInterval(callback, timeout) {
            return addTimer.call(this, arguments, true);
        },

        clearInterval: function clearInterval(timerId) {
            this.clearTimeout(timerId);
        },

        setImmediate: function setImmediate(callback) {
            var passThruArgs = Array.prototype.slice.call(arguments, 1);

            return addTimer.call(this, [callback, 0].concat(passThruArgs), false);
        },

        clearImmediate: function clearImmediate(timerId) {
            this.clearTimeout(timerId);
        },

        tick: function tick(ms) {
            ms = typeof ms == "number" ? ms : parseTime(ms);
            var tickFrom = this.now, tickTo = this.now + ms, previous = this.now;
            var timer = this.firstTimerInRange(tickFrom, tickTo);

            var firstException;
            while (timer && tickFrom <= tickTo) {
                if (this.timeouts[timer.id]) {
                    tickFrom = this.now = timer.callAt;
                    try {
                      this.callTimer(timer);
                    } catch (e) {
                      firstException = firstException || e;
                    }
                }

                timer = this.firstTimerInRange(previous, tickTo);
                previous = tickFrom;
            }

            this.now = tickTo;

            if (firstException) {
              throw firstException;
            }

            return this.now;
        },

        firstTimerInRange: function (from, to) {
            var timer, smallest = null, originalTimer;

            for (var id in this.timeouts) {
                if (this.timeouts.hasOwnProperty(id)) {
                    if (this.timeouts[id].callAt < from || this.timeouts[id].callAt > to) {
                        continue;
                    }

                    if (smallest === null || this.timeouts[id].callAt < smallest) {
                        originalTimer = this.timeouts[id];
                        smallest = this.timeouts[id].callAt;

                        timer = {
                            func: this.timeouts[id].func,
                            callAt: this.timeouts[id].callAt,
                            interval: this.timeouts[id].interval,
                            id: this.timeouts[id].id,
                            invokeArgs: this.timeouts[id].invokeArgs
                        };
                    }
                }
            }

            return timer || null;
        },

        callTimer: function (timer) {
            if (typeof timer.interval == "number") {
                this.timeouts[timer.id].callAt += timer.interval;
            } else {
                delete this.timeouts[timer.id];
            }

            try {
                if (typeof timer.func == "function") {
                    timer.func.apply(null, timer.invokeArgs);
                } else {
                    eval(timer.func);
                }
            } catch (e) {
              var exception = e;
            }

            if (!this.timeouts[timer.id]) {
                if (exception) {
                  throw exception;
                }
                return;
            }

            if (exception) {
              throw exception;
            }
        },

        reset: function reset() {
            this.timeouts = {};
        },

        Date: (function () {
            var NativeDate = Date;

            function ClockDate(year, month, date, hour, minute, second, ms) {
                // Defensive and verbose to avoid potential harm in passing
                // explicit undefined when user does not pass argument
                switch (arguments.length) {
                case 0:
                    return new NativeDate(ClockDate.clock.now);
                case 1:
                    return new NativeDate(year);
                case 2:
                    return new NativeDate(year, month);
                case 3:
                    return new NativeDate(year, month, date);
                case 4:
                    return new NativeDate(year, month, date, hour);
                case 5:
                    return new NativeDate(year, month, date, hour, minute);
                case 6:
                    return new NativeDate(year, month, date, hour, minute, second);
                default:
                    return new NativeDate(year, month, date, hour, minute, second, ms);
                }
            }

            return mirrorDateProperties(ClockDate, NativeDate);
        }())
    };

    function mirrorDateProperties(target, source) {
        if (source.now) {
            target.now = function now() {
                return target.clock.now;
            };
        } else {
            delete target.now;
        }

        if (source.toSource) {
            target.toSource = function toSource() {
                return source.toSource();
            };
        } else {
            delete target.toSource;
        }

        target.toString = function toString() {
            return source.toString();
        };

        target.prototype = source.prototype;
        target.parse = source.parse;
        target.UTC = source.UTC;
        target.prototype.toUTCString = source.prototype.toUTCString;

        for (var prop in source) {
            if (source.hasOwnProperty(prop)) {
                target[prop] = source[prop];
            }
        }

        return target;
    }

    var methods = ["Date", "setTimeout", "setInterval",
                   "clearTimeout", "clearInterval"];

    if (typeof global.setImmediate !== "undefined") {
        methods.push("setImmediate");
    }

    if (typeof global.clearImmediate !== "undefined") {
        methods.push("clearImmediate");
    }

    function restore() {
        var method;

        for (var i = 0, l = this.methods.length; i < l; i++) {
            method = this.methods[i];

            if (global[method].hadOwnProperty) {
                global[method] = this["_" + method];
            } else {
                try {
                    delete global[method];
                } catch (e) {}
            }
        }

        // Prevent multiple executions which will completely remove these props
        this.methods = [];
    }

    function stubGlobal(method, clock) {
        clock[method].hadOwnProperty = Object.prototype.hasOwnProperty.call(global, method);
        clock["_" + method] = global[method];

        if (method == "Date") {
            var date = mirrorDateProperties(clock[method], global[method]);
            global[method] = date;
        } else {
            global[method] = function () {
                return clock[method].apply(clock, arguments);
            };

            for (var prop in clock[method]) {
                if (clock[method].hasOwnProperty(prop)) {
                    global[method][prop] = clock[method][prop];
                }
            }
        }

        global[method].clock = clock;
    }

    sinon.useFakeTimers = function useFakeTimers(now) {
        var clock = sinon.clock.create(now);
        clock.restore = restore;
        clock.methods = Array.prototype.slice.call(arguments,
                                                   typeof now == "number" ? 1 : 0);

        if (clock.methods.length === 0) {
            clock.methods = methods;
        }

        for (var i = 0, l = clock.methods.length; i < l; i++) {
            stubGlobal(clock.methods[i], clock);
        }

        return clock;
    };
}(typeof global != "undefined" && typeof global !== "function" ? global : this));

sinon.timers = {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setImmediate: (typeof setImmediate !== "undefined" ? setImmediate : undefined),
    clearImmediate: (typeof clearImmediate !== "undefined" ? clearImmediate: undefined),
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = sinon;
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(require,module,exports){
(function (global){
((typeof define === "function" && define.amd && function (m) {
    define("formatio", ["samsam"], m);
}) || (typeof module === "object" && function (m) {
    module.exports = m(require("samsam"));
}) || function (m) { this.formatio = m(this.samsam); }
)(function (samsam) {
    "use strict";

    var formatio = {
        excludeConstructors: ["Object", /^.$/],
        quoteStrings: true
    };

    var hasOwn = Object.prototype.hasOwnProperty;

    var specialObjects = [];
    if (typeof global !== "undefined") {
        specialObjects.push({ object: global, value: "[object global]" });
    }
    if (typeof document !== "undefined") {
        specialObjects.push({
            object: document,
            value: "[object HTMLDocument]"
        });
    }
    if (typeof window !== "undefined") {
        specialObjects.push({ object: window, value: "[object Window]" });
    }

    function functionName(func) {
        if (!func) { return ""; }
        if (func.displayName) { return func.displayName; }
        if (func.name) { return func.name; }
        var matches = func.toString().match(/function\s+([^\(]+)/m);
        return (matches && matches[1]) || "";
    }

    function constructorName(f, object) {
        var name = functionName(object && object.constructor);
        var excludes = f.excludeConstructors ||
                formatio.excludeConstructors || [];

        var i, l;
        for (i = 0, l = excludes.length; i < l; ++i) {
            if (typeof excludes[i] === "string" && excludes[i] === name) {
                return "";
            } else if (excludes[i].test && excludes[i].test(name)) {
                return "";
            }
        }

        return name;
    }

    function isCircular(object, objects) {
        if (typeof object !== "object") { return false; }
        var i, l;
        for (i = 0, l = objects.length; i < l; ++i) {
            if (objects[i] === object) { return true; }
        }
        return false;
    }

    function ascii(f, object, processed, indent) {
        if (typeof object === "string") {
            var qs = f.quoteStrings;
            var quote = typeof qs !== "boolean" || qs;
            return processed || quote ? '"' + object + '"' : object;
        }

        if (typeof object === "function" && !(object instanceof RegExp)) {
            return ascii.func(object);
        }

        processed = processed || [];

        if (isCircular(object, processed)) { return "[Circular]"; }

        if (Object.prototype.toString.call(object) === "[object Array]") {
            return ascii.array.call(f, object, processed);
        }

        if (!object) { return String((1/object) === -Infinity ? "-0" : object); }
        if (samsam.isElement(object)) { return ascii.element(object); }

        if (typeof object.toString === "function" &&
                object.toString !== Object.prototype.toString) {
            return object.toString();
        }

        var i, l;
        for (i = 0, l = specialObjects.length; i < l; i++) {
            if (object === specialObjects[i].object) {
                return specialObjects[i].value;
            }
        }

        return ascii.object.call(f, object, processed, indent);
    }

    ascii.func = function (func) {
        return "function " + functionName(func) + "() {}";
    };

    ascii.array = function (array, processed) {
        processed = processed || [];
        processed.push(array);
        var i, l, pieces = [];
        for (i = 0, l = array.length; i < l; ++i) {
            pieces.push(ascii(this, array[i], processed));
        }
        return "[" + pieces.join(", ") + "]";
    };

    ascii.object = function (object, processed, indent) {
        processed = processed || [];
        processed.push(object);
        indent = indent || 0;
        var pieces = [], properties = samsam.keys(object).sort();
        var length = 3;
        var prop, str, obj, i, l;

        for (i = 0, l = properties.length; i < l; ++i) {
            prop = properties[i];
            obj = object[prop];

            if (isCircular(obj, processed)) {
                str = "[Circular]";
            } else {
                str = ascii(this, obj, processed, indent + 2);
            }

            str = (/\s/.test(prop) ? '"' + prop + '"' : prop) + ": " + str;
            length += str.length;
            pieces.push(str);
        }

        var cons = constructorName(this, object);
        var prefix = cons ? "[" + cons + "] " : "";
        var is = "";
        for (i = 0, l = indent; i < l; ++i) { is += " "; }

        if (length + indent > 80) {
            return prefix + "{\n  " + is + pieces.join(",\n  " + is) + "\n" +
                is + "}";
        }
        return prefix + "{ " + pieces.join(", ") + " }";
    };

    ascii.element = function (element) {
        var tagName = element.tagName.toLowerCase();
        var attrs = element.attributes, attr, pairs = [], attrName, i, l, val;

        for (i = 0, l = attrs.length; i < l; ++i) {
            attr = attrs.item(i);
            attrName = attr.nodeName.toLowerCase().replace("html:", "");
            val = attr.nodeValue;
            if (attrName !== "contenteditable" || val !== "inherit") {
                if (!!val) { pairs.push(attrName + "=\"" + val + "\""); }
            }
        }

        var formatted = "<" + tagName + (pairs.length > 0 ? " " : "");
        var content = element.innerHTML;

        if (content.length > 20) {
            content = content.substr(0, 20) + "[...]";
        }

        var res = formatted + pairs.join(" ") + ">" + content +
                "</" + tagName + ">";

        return res.replace(/ contentEditable="inherit"/, "");
    };

    function Formatio(options) {
        for (var opt in options) {
            this[opt] = options[opt];
        }
    }

    Formatio.prototype = {
        functionName: functionName,

        configure: function (options) {
            return new Formatio(options);
        },

        constructorName: function (object) {
            return constructorName(this, object);
        },

        ascii: function (object, processed, indent) {
            return ascii(this, object, processed, indent);
        }
    };

    return Formatio.prototype;
});

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"samsam":19}],19:[function(require,module,exports){
((typeof define === "function" && define.amd && function (m) { define("samsam", m); }) ||
 (typeof module === "object" &&
      function (m) { module.exports = m(); }) || // Node
 function (m) { this.samsam = m(); } // Browser globals
)(function () {
    var o = Object.prototype;
    var div = typeof document !== "undefined" && document.createElement("div");

    function isNaN(value) {
        // Unlike global isNaN, this avoids type coercion
        // typeof check avoids IE host object issues, hat tip to
        // lodash
        var val = value; // JsLint thinks value !== value is "weird"
        return typeof value === "number" && value !== val;
    }

    function getClass(value) {
        // Returns the internal [[Class]] by calling Object.prototype.toString
        // with the provided value as this. Return value is a string, naming the
        // internal class, e.g. "Array"
        return o.toString.call(value).split(/[ \]]/)[1];
    }

    /**
     * @name samsam.isArguments
     * @param Object object
     *
     * Returns ``true`` if ``object`` is an ``arguments`` object,
     * ``false`` otherwise.
     */
    function isArguments(object) {
        if (getClass(object) === 'Arguments') { return true; }
        if (typeof object !== "object" || typeof object.length !== "number" ||
                getClass(object) === "Array") {
            return false;
        }
        if (typeof object.callee == "function") { return true; }
        try {
            object[object.length] = 6;
            delete object[object.length];
        } catch (e) {
            return true;
        }
        return false;
    }

    /**
     * @name samsam.isElement
     * @param Object object
     *
     * Returns ``true`` if ``object`` is a DOM element node. Unlike
     * Underscore.js/lodash, this function will return ``false`` if ``object``
     * is an *element-like* object, i.e. a regular object with a ``nodeType``
     * property that holds the value ``1``.
     */
    function isElement(object) {
        if (!object || object.nodeType !== 1 || !div) { return false; }
        try {
            object.appendChild(div);
            object.removeChild(div);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * @name samsam.keys
     * @param Object object
     *
     * Return an array of own property names.
     */
    function keys(object) {
        var ks = [], prop;
        for (prop in object) {
            if (o.hasOwnProperty.call(object, prop)) { ks.push(prop); }
        }
        return ks;
    }

    /**
     * @name samsam.isDate
     * @param Object value
     *
     * Returns true if the object is a ``Date``, or *date-like*. Duck typing
     * of date objects work by checking that the object has a ``getTime``
     * function whose return value equals the return value from the object's
     * ``valueOf``.
     */
    function isDate(value) {
        return typeof value.getTime == "function" &&
            value.getTime() == value.valueOf();
    }

    /**
     * @name samsam.isNegZero
     * @param Object value
     *
     * Returns ``true`` if ``value`` is ``-0``.
     */
    function isNegZero(value) {
        return value === 0 && 1 / value === -Infinity;
    }

    /**
     * @name samsam.equal
     * @param Object obj1
     * @param Object obj2
     *
     * Returns ``true`` if two objects are strictly equal. Compared to
     * ``===`` there are two exceptions:
     *
     *   - NaN is considered equal to NaN
     *   - -0 and +0 are not considered equal
     */
    function identical(obj1, obj2) {
        if (obj1 === obj2 || (isNaN(obj1) && isNaN(obj2))) {
            return obj1 !== 0 || isNegZero(obj1) === isNegZero(obj2);
        }
    }


    /**
     * @name samsam.deepEqual
     * @param Object obj1
     * @param Object obj2
     *
     * Deep equal comparison. Two values are "deep equal" if:
     *
     *   - They are equal, according to samsam.identical
     *   - They are both date objects representing the same time
     *   - They are both arrays containing elements that are all deepEqual
     *   - They are objects with the same set of properties, and each property
     *     in ``obj1`` is deepEqual to the corresponding property in ``obj2``
     *
     * Supports cyclic objects.
     */
    function deepEqualCyclic(obj1, obj2) {

        // used for cyclic comparison
        // contain already visited objects
        var objects1 = [],
            objects2 = [],
        // contain pathes (position in the object structure)
        // of the already visited objects
        // indexes same as in objects arrays
            paths1 = [],
            paths2 = [],
        // contains combinations of already compared objects
        // in the manner: { "$1['ref']$2['ref']": true }
            compared = {};

        /**
         * used to check, if the value of a property is an object
         * (cyclic logic is only needed for objects)
         * only needed for cyclic logic
         */
        function isObject(value) {

            if (typeof value === 'object' && value !== null &&
                    !(value instanceof Boolean) &&
                    !(value instanceof Date)    &&
                    !(value instanceof Number)  &&
                    !(value instanceof RegExp)  &&
                    !(value instanceof String)) {

                return true;
            }

            return false;
        }

        /**
         * returns the index of the given object in the
         * given objects array, -1 if not contained
         * only needed for cyclic logic
         */
        function getIndex(objects, obj) {

            var i;
            for (i = 0; i < objects.length; i++) {
                if (objects[i] === obj) {
                    return i;
                }
            }

            return -1;
        }

        // does the recursion for the deep equal check
        return (function deepEqual(obj1, obj2, path1, path2) {
            var type1 = typeof obj1;
            var type2 = typeof obj2;

            // == null also matches undefined
            if (obj1 === obj2 ||
                    isNaN(obj1) || isNaN(obj2) ||
                    obj1 == null || obj2 == null ||
                    type1 !== "object" || type2 !== "object") {

                return identical(obj1, obj2);
            }

            // Elements are only equal if identical(expected, actual)
            if (isElement(obj1) || isElement(obj2)) { return false; }

            var isDate1 = isDate(obj1), isDate2 = isDate(obj2);
            if (isDate1 || isDate2) {
                if (!isDate1 || !isDate2 || obj1.getTime() !== obj2.getTime()) {
                    return false;
                }
            }

            if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
                if (obj1.toString() !== obj2.toString()) { return false; }
            }

            var class1 = getClass(obj1);
            var class2 = getClass(obj2);
            var keys1 = keys(obj1);
            var keys2 = keys(obj2);

            if (isArguments(obj1) || isArguments(obj2)) {
                if (obj1.length !== obj2.length) { return false; }
            } else {
                if (type1 !== type2 || class1 !== class2 ||
                        keys1.length !== keys2.length) {
                    return false;
                }
            }

            var key, i, l,
                // following vars are used for the cyclic logic
                value1, value2,
                isObject1, isObject2,
                index1, index2,
                newPath1, newPath2;

            for (i = 0, l = keys1.length; i < l; i++) {
                key = keys1[i];
                if (!o.hasOwnProperty.call(obj2, key)) {
                    return false;
                }

                // Start of the cyclic logic

                value1 = obj1[key];
                value2 = obj2[key];

                isObject1 = isObject(value1);
                isObject2 = isObject(value2);

                // determine, if the objects were already visited
                // (it's faster to check for isObject first, than to
                // get -1 from getIndex for non objects)
                index1 = isObject1 ? getIndex(objects1, value1) : -1;
                index2 = isObject2 ? getIndex(objects2, value2) : -1;

                // determine the new pathes of the objects
                // - for non cyclic objects the current path will be extended
                //   by current property name
                // - for cyclic objects the stored path is taken
                newPath1 = index1 !== -1
                    ? paths1[index1]
                    : path1 + '[' + JSON.stringify(key) + ']';
                newPath2 = index2 !== -1
                    ? paths2[index2]
                    : path2 + '[' + JSON.stringify(key) + ']';

                // stop recursion if current objects are already compared
                if (compared[newPath1 + newPath2]) {
                    return true;
                }

                // remember the current objects and their pathes
                if (index1 === -1 && isObject1) {
                    objects1.push(value1);
                    paths1.push(newPath1);
                }
                if (index2 === -1 && isObject2) {
                    objects2.push(value2);
                    paths2.push(newPath2);
                }

                // remember that the current objects are already compared
                if (isObject1 && isObject2) {
                    compared[newPath1 + newPath2] = true;
                }

                // End of cyclic logic

                // neither value1 nor value2 is a cycle
                // continue with next level
                if (!deepEqual(value1, value2, newPath1, newPath2)) {
                    return false;
                }
            }

            return true;

        }(obj1, obj2, '$1', '$2'));
    }

    var match;

    function arrayContains(array, subset) {
        if (subset.length === 0) { return true; }
        var i, l, j, k;
        for (i = 0, l = array.length; i < l; ++i) {
            if (match(array[i], subset[0])) {
                for (j = 0, k = subset.length; j < k; ++j) {
                    if (!match(array[i + j], subset[j])) { return false; }
                }
                return true;
            }
        }
        return false;
    }

    /**
     * @name samsam.match
     * @param Object object
     * @param Object matcher
     *
     * Compare arbitrary value ``object`` with matcher.
     */
    match = function match(object, matcher) {
        if (matcher && typeof matcher.test === "function") {
            return matcher.test(object);
        }

        if (typeof matcher === "function") {
            return matcher(object) === true;
        }

        if (typeof matcher === "string") {
            matcher = matcher.toLowerCase();
            var notNull = typeof object === "string" || !!object;
            return notNull &&
                (String(object)).toLowerCase().indexOf(matcher) >= 0;
        }

        if (typeof matcher === "number") {
            return matcher === object;
        }

        if (typeof matcher === "boolean") {
            return matcher === object;
        }

        if (getClass(object) === "Array" && getClass(matcher) === "Array") {
            return arrayContains(object, matcher);
        }

        if (matcher && typeof matcher === "object") {
            var prop;
            for (prop in matcher) {
                var value = object[prop];
                if (typeof value === "undefined" &&
                        typeof object.getAttribute === "function") {
                    value = object.getAttribute(prop);
                }
                if (typeof value === "undefined" || !match(value, matcher[prop])) {
                    return false;
                }
            }
            return true;
        }

        throw new Error("Matcher was not a string, a number, a " +
                        "function, a boolean or an object");
    };

    return {
        isArguments: isArguments,
        isElement: isElement,
        isDate: isDate,
        isNegZero: isNegZero,
        identical: identical,
        deepEqual: deepEqualCyclic,
        match: match,
        keys: keys
    };
});

},{}],20:[function(require,module,exports){
(function (global){
(function(root) {
    var unopinionate = {
        selector: root.jQuery || root.Zepto || root.ender || root.$,
        template: root.Handlebars || root.Mustache
    };

    /*** Export ***/

    //AMD
    if(typeof define === 'function' && define.amd) {
        define([], function() {
            return unopinionate;
        });
    }
    //CommonJS
    else if(typeof module.exports !== 'undefined') {
        module.exports = unopinionate;
    }
    //Global
    else {
        root.unopinionate = unopinionate;
    }
})(typeof window != 'undefined' ? window : global);

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],21:[function(require,module,exports){
var $ = require('unopinionate').selector,
        specialKeys = require('./specialKeys');

var $window = $(window);

var Event = function(selector) {
    this.selector   = selector;
    this.callbacks  = [];
    this.active     = true;
};

Event.prototype = {
    up: function(events) {
        this.bind('up', events);
        return this;
    },
    down: function(events) {
        this.bind('down', events);
        return this;
    },
    bind: function(type, events) {
        var self = this;

        if($.isPlainObject(events)) {
            $.each(events, function(key, callback) {
                self._add(type, key, callback);
            });
        }
        else {
            this._add(type, false, events);
        }

        return this;
    },
    on: function() {
        this.active = true;
        return this;
    },
    off: function() {
        this.active = false;
        return this;
    },
    destroy: function() {
        $window
            .unbind('keydown')
            .unbind('keyup');
    },

    /*** Internal Functions ***/
    _add: function(type, conditions, callback) {
        var self = this;

        if(!this.callbacks[type]) {
            this.callbacks[type] = [];

            $window.bind('key' + type, this.selector, function(e) {
                if(self.active) {
                    var callbacks = self.callbacks[type];

                    for(var i=0; i<callbacks.length; i++) {
                        var callback = callbacks[i];
                        if(!callback.conditions || self._validate(callback.conditions, e)) {
                            callback.apply(self, [e]);
                        }
                    }
                }
            });
        }

        if(conditions) {
            callback.conditions = this._parseConditions(conditions);
        }

        this.callbacks[type].push(callback);
    },
    _parseConditions: function(c) {
        var conditions = {
            shift:   /\bshift\b/i.test(c),
            alt:     /\b(alt|alternate)\b/i.test(c),
            ctrl:    /\b(ctrl|control|cmd|command)\b/i.test(c)
        };

        //Key Binding
        var keys = c.match(/\b(?!shift|alt|alternate|ctrl|control|cmd|command)([a-z\u0060\-=\[\]\\;',\.\/]+)\b/gi);

        if(!keys) {
            //Use modifier as key if there is no other key
            keys = c.match(/\b(\w+)\b/gi);

            //Modifiers should all be false
            conditions.shift =
            conditions.alt   =
            conditions.ctrl  = false;
        }

        if(keys) {
            conditions.key = keys[0];
            
            if(keys.length > 1) {
                console.warn("More than one key bound in '"+c+"'. Using the first one ("+keys[0]+").");
            }
        }
        else {
            conditions.key      =
            conditions.keyCode  = null;
        }

        return conditions;
    },
    _keyCodeTest: function(key, keyCode) {
        if(typeof specialKeys[keyCode] !== 'undefined') {
            var keyDef = specialKeys[keyCode];

            if(keyDef instanceof RegExp) {
                return keyDef.test(key);
            }
            else {
                return keyDef === key.toLowerCase();
            }
        }
        else if(key.length === 1) {
            return key.toUpperCase().charCodeAt(0) === keyCode;
        }
        else {
            return false;
        }
    },
    _validate: function(c, e) {
        return  (c.key ? this._keyCodeTest(c.key, e.which) : true) &&
                c.shift === e.shiftKey &&
                c.alt   === e.altKey &&
                (!c.ctrl || (c.ctrl === e.metaKey) !== (c.ctrl === e.ctrlKey));
    }
};

module.exports = Event;


},{"./specialKeys":23,"unopinionate":20}],22:[function(require,module,exports){
var Event = require('./Event.js'),
    events = [];

var key = function(selector) { //Factory for Event objects
    return key._createEvent(selector);
};

key.down = function(config) {
    return this._createEvent().down(config);
};

key.up = function(config) {
    return this._createEvent().up(config);
};

key.unbindAll = function() {
    while(events.length) {
        events.pop().destroy();
    }

    return this;
};

//Creates new Event objects and pushes them into events array
key._createEvent = function(selector) {
    var e = new Event(selector);
    events.push(e);
    return e;
};

module.exports = key;

},{"./Event.js":21}],23:[function(require,module,exports){
//Adopted from [jQuery hotkeys](https://github.com/jeresig/jquery.hotkeys/blob/master/jquery.hotkeys.js)

module.exports = {
    8: "backspace",
    9: "tab",
    10: /^(return|enter)$/i,
    13: /^(return|enter)$/i,
    16: "shift",
    17: /^(ctrl|control)$/i,
    18: /^(alt|alternate)$/i,
    19: "pause",
    20: "capslock",
    27: /^(esc|escape)$/i,
    32: "space",
    33: "pageup",
    34: "pagedown",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    45: "insert",
    46: /^(del|delete)$/i,
    91: /^(cmd|command)$/i,
    96: "0",
    97: "1",
    98: "2",
    99: "3",
    100: "4",
    101: "5",
    102: "6",
    103: "7",
    104: "8",
    105: "9",
    106: "*",
    107: "+",
    109: "-",
    110: ".",
    111 : "/",
    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
    122: "f11",
    123: "f12",
    144: "numlock",
    145: "scroll",
    186: ";",
    187: "=",
    189: "-",
    190: ".",
    191: "/",
    192: "`",
    219: "[",
    220: "\\",
    221: "]",
    222: "'",
    224: "meta"
};

},{}],24:[function(require,module,exports){
var sinon = require('sinon'),
    key   = require('../src/main'),
    module = window.module,
    sandbox,
    testCallback;

/*** GLOBAL KEY EVENTS ***/

module("global key events", {
    setup: function() {
        sandbox         = sinon.sandbox.create();
        testCallback    = sinon.spy();
    },
    teardown: function() {
        key.unbindAll();
    }
});

test('key.down', function() {
    key.down(testCallback);

    $(document).keydown();
    $(window).keydown();

    deepEqual(testCallback.callCount, 2);
});

test('key.up', function() {
    key.up(testCallback);

    $(document).keyup();
    $(window).keyup();

    deepEqual(testCallback.callCount, 2);
});

test('key.unbindAll', function() {
    key.down(testCallback);
    key.up(testCallback);
    key.unbindAll();

    $(window).keydown().keyup();

    ok(!testCallback.called);
});


test('key._createEvent', function() {
    var keyevent1 = key.down(testCallback),
        keyevent2 = key.up(testCallback);

    notEqual(keyevent1, keyevent2, "Global key events should return different Event objects");

    keydown1 = key('#input');
    keydown2 = key('#input');

    deepEqual(keyevent1, keyevent2, "Key events with the same selector should return different Event objects");
});


/*** DOM ELEMENT KEY EVENTS ***/

var $input,
    keyEvent;

module("DOM element key events", {
    setup: function() {
        sandbox         = sinon.sandbox.create();
        testCallback    = sinon.spy();
        $input          = $("#input");
        keyEvent        = key($input);
    },
    teardown: function() {
        key.unbindAll();
    }
});

test('keyEvent.up', function() {
    keyEvent.up(testCallback);

    $input.keyup();
    ok(testCallback.called);
});

test('keyEvent.down', function() {
    keyEvent.down(testCallback);
    
    $input.keydown();
    ok(testCallback.called);
});

test('keyEvent.bind', function() {
    keyEvent.bind('down', testCallback);

    $input.keydown();
    ok(testCallback.called);
});

test('keyEvent off/on', function() {
    keyEvent
        .down(testCallback)
        .off();

    $input.keydown();
    ok(!testCallback.called, "Off Works");

    keyEvent.on();
    $input.keydown();

    ok(testCallback.called, "On Works");
});

test('keyEvent.destroy', function() {
    keyEvent
        .down(testCallback)
        .destroy();

    $input.keydown();
    ok(!testCallback.called, "No Callbacks Fired");
});

test('keyEvent._add', function() {
    keyEvent._add('down', false, testCallback);

    $input.keydown();
    ok(testCallback.called, "Add without conditions works.");


    //ok(testCallback.called, "Add with conditions works.");
});



/*** Key Condition Testing ***/

module("Key Conditions", {
    setup: function() {
        sandbox         = sinon.sandbox.create();
        testCallback    = sinon.spy();
        $input          = $("#input");
        keyEvent        = key($input);
    },
    teardown: function() {
        key.unbindAll();
    }
});

test('keyEvent._parseConditions Modifiers', function() {
    var conditions = keyEvent._parseConditions('shift a');
    ok(conditions.shift, "Shift Modifier");
    
    conditions = keyEvent._parseConditions('alt a');
    ok(conditions.alt, "Alt Modifier");

    conditions = keyEvent._parseConditions('ctrl a');
    ok(conditions.ctrl, "Ctrl Modifier");

    conditions = keyEvent._parseConditions('ALT a');
    ok(conditions.alt, "UPPERCASE Modifiers");

    conditions = keyEvent._parseConditions('alt+a');
    ok(conditions.alt, "Dash Separators");

    conditions = keyEvent._parseConditions('ctrl shift alt a');
    ok(conditions.alt && conditions.shift && conditions.ctrl, "Multiple modifiers work");

    conditions = keyEvent._parseConditions('cmd a');
    ok(conditions.ctrl, "cmd aliases ctrl");
});

test('keyEvent._parseConditions keys', function() {
    var conditions = keyEvent._parseConditions('a');
    equal(conditions.key, "a", "Recognizes one character.");

    conditions = keyEvent._parseConditions('backspace');
    equal(conditions.key, "backspace", "Recognizes longer words.");

    conditions = keyEvent._parseConditions('shift backspace');
    equal(conditions.key, "backspace", "Ignores modifiers.");

    conditions = keyEvent._parseConditions('shift');
    equal(conditions.key, "shift", "Uses modifier as key if no other key is provided");

    conditions = keyEvent._parseConditions('');
    ok(!conditions.key && !conditions.keyCode && !conditions.alt && !conditions.shift && !conditions.ctrl, "Empty returns all false");
});

test('keyEvent._keyCodeTest', function() {
    ok(keyEvent._keyCodeTest('a', 65), "Standard lowercase letter key");
    ok(keyEvent._keyCodeTest('A', 65), "Standard uppercase letter key");
    ok(!keyEvent._keyCodeTest('A', 68), "Wrong letter key");
    ok(!keyEvent._keyCodeTest('avnasd', 65), "Undefined key");
    ok(keyEvent._keyCodeTest('ctrl', 17), "Ctrl key");
    ok(keyEvent._keyCodeTest('control', 17), "command key");
    ok(keyEvent._keyCodeTest('cmd', 91), "Cmd key");
    ok(keyEvent._keyCodeTest('command', 91), "command key");
    ok(keyEvent._keyCodeTest('5', 53), "Number key");
    ok(keyEvent._keyCodeTest('`', 192), "` key");
    ok(keyEvent._keyCodeTest('backspace', 8), "backspace key");
    ok(keyEvent._keyCodeTest('BACKSPACE', 8), "BACKSPACE key");
    ok(keyEvent._keyCodeTest('delete', 46), "delete key");
    ok(keyEvent._keyCodeTest('enter', 13), "enter key (13)");
    ok(keyEvent._keyCodeTest('enter', 10), "enter key (10)");
    ok(keyEvent._keyCodeTest('return', 13), "return key (13)");
    ok(keyEvent._keyCodeTest('return', 10), "return key (10)");
    ok(keyEvent._keyCodeTest('.', 190), ". key");
    ok(keyEvent._keyCodeTest("'", 222), "' key");
    ok(keyEvent._keyCodeTest("[", 219), "[ key");
    ok(keyEvent._keyCodeTest("]", 221), "] key");
    ok(keyEvent._keyCodeTest("f1", 112), "f1 key");
    ok(keyEvent._keyCodeTest("F2", 113), "F2 key");
    ok(keyEvent._keyCodeTest("-", 189), "- key");
    ok(keyEvent._keyCodeTest("=", 187), "= key");
    ok(keyEvent._keyCodeTest("esc", 27), "esc key");
    ok(keyEvent._keyCodeTest("space", 32), "space key");
});

test('keyEvent._validate', function() {
    ok(
        keyEvent._validate({
            key:        'a',
            shift:      false,
            alt:        false,
            ctrl:       false
        }, {
            which:      65,
            shiftKey:   false,
            altKey:     false,
            metaKey:    false
        }),
        "'a' key"
    );

    ok(
        !keyEvent._validate({
            key:        'a',
            shift:      false,
            alt:        false,
            ctrl:       false
        }, {
            which:      65,
            shiftKey:   true,
            altKey:     false,
            metaKey:    false
        }),
        "not 'a' key"
    );

    ok(
        keyEvent._validate({
            key:        'cmd',
            shift:      false,
            alt:        false,
            ctrl:       false
        }, {
            which:      91,
            shiftKey:   false,
            altKey:     false,
            metaKey:    false
        }),
        "cmd key"
    );

    ok(
        keyEvent._validate({
            key:        'b',
            shift:      true,
            alt:        false,
            ctrl:       true
        }, {
            which:      66,
            shiftKey:   true,
            altKey:     false,
            metaKey:    false,
            ctrlKey:    true
        }),
        "ctrl+shift+b"
    );

    ok(
        keyEvent._validate({
            key:        'b',
            shift:      true,
            alt:        false,
            ctrl:       true
        }, {
            which:      66,
            shiftKey:   true,
            altKey:     false,
            metaKey:    true,
            ctrlKey:    false
        }),
        "cmd+shift+b"
    );

    ok(
        keyEvent._validate({
            key:        '-',
            shift:      true,
            alt:        false,
            ctrl:       true
        }, {
            which:      189,
            shiftKey:   true,
            altKey:     false,
            metaKey:    true,
            ctrlKey:    false
        }),
        "cmd shift - (special key)"
    );

    ok(
        keyEvent._validate({
            key:        '/',
            shift:      false,
            alt:        false,
            ctrl:       true
        }, {
            which:      191,
            shiftKey:   false,
            altKey:     false,
            metaKey:    true,
            ctrlKey:    false
        }),
        "cmd+/ (another special key)"
    );

});


/*** Conditional Key Bindings ***/
var e;
module("Conditional Key Bindings", {
    setup: function() {
        sandbox         = sinon.sandbox.create();
        testCallback    = sinon.spy();
        $input          = $("#input");
        keyEvent        = key($input);

        e = $.Event('keydown');
        e.which    = null;
        e.ctrlKey  = false;
        e.altKey   = false;
        e.metaKey  = false;
        e.shiftKey = false;
    },
    teardown: function() {
        key.unbindAll();
    }
});

test('global key code', function() {
    key.down({
        'ctrl+a': testCallback
    });

    e.which    = 65;
    e.ctrlKey  = true;

    $(window).trigger(e);

    ok(testCallback.called);
});

test('DOM element key code', function() {
    keyEvent.down({
        'ctrl+a': testCallback
    });

    e.which    = 65;
    e.ctrlKey  = true;

    $input.trigger(e);

    ok(testCallback.called);
});

test('global key code no match', function() {
    key.down({
        'ctrl+shift+a': testCallback
    });

    e.which    = 65;
    e.ctrlKey  = true;

    $(window).trigger(e);

    ok(!testCallback.called);
});

test('cmd key matches ctrl key', function() {
    key.down({
        'cmd+shift+a': testCallback
    });

    e.which    = 65;
    e.ctrlKey  = true;
    e.shiftKey = true;

    $(window).trigger(e);

    ok(testCallback.called);
});

test('shift binding', function() {
    key.down({
        'shift': testCallback
    });

    e.which = 16;

    $(window).trigger(e);

    ok(testCallback.called);
});

test('this in a callback should be the key object itself', function() {
    var down = key.down(function() {
        deepEqual(down, this);
    });

    $(window).trigger(e);
});


},{"../src/main":22,"sinon":5}]},{},[24])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kcm9jaGV0dGkvZGV2L2pzL3dvcmtzcGFjZS9vbktleS9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9Vc2Vycy9kcm9jaGV0dGkvZGV2L2pzL3dvcmtzcGFjZS9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uLmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vYXNzZXJ0LmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vYmVoYXZpb3IuanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL2xpYi9zaW5vbi9jYWxsLmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vY29sbGVjdGlvbi5qcyIsIi9Vc2Vycy9kcm9jaGV0dGkvZGV2L2pzL3dvcmtzcGFjZS9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL21hdGNoLmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vbW9jay5qcyIsIi9Vc2Vycy9kcm9jaGV0dGkvZGV2L2pzL3dvcmtzcGFjZS9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL3NhbmRib3guanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL2xpYi9zaW5vbi9zcHkuanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL2xpYi9zaW5vbi9zdHViLmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vdGVzdC5qcyIsIi9Vc2Vycy9kcm9jaGV0dGkvZGV2L2pzL3dvcmtzcGFjZS9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL3Rlc3RfY2FzZS5qcyIsIi9Vc2Vycy9kcm9jaGV0dGkvZGV2L2pzL3dvcmtzcGFjZS9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL3V0aWwvZmFrZV90aW1lcnMuanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL25vZGVfbW9kdWxlcy9mb3JtYXRpby9saWIvZm9ybWF0aW8uanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL25vZGVfbW9kdWxlcy9mb3JtYXRpby9ub2RlX21vZHVsZXMvc2Ftc2FtL2xpYi9zYW1zYW0uanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvbm9kZV9tb2R1bGVzL3Vub3BpbmlvbmF0ZS91bm9waW5pb25hdGUuanMiLCIvVXNlcnMvZHJvY2hldHRpL2Rldi9qcy93b3Jrc3BhY2Uvb25LZXkvc3JjL0V2ZW50LmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L3NyYy9tYWluLmpzIiwiL1VzZXJzL2Ryb2NoZXR0aS9kZXYvanMvd29ya3NwYWNlL29uS2V5L3NyYy9zcGVjaWFsS2V5cy5qcyIsIi9Vc2Vycy9kcm9jaGV0dGkvZGV2L2pzL3dvcmtzcGFjZS9vbktleS90ZXN0L3Rlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCl7XG4vLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiSmtwUjJGXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlLCBmb3JpbjogdHJ1ZSwgbm9tZW46IGZhbHNlLCByZWdleHA6IGZhbHNlLCBwbHVzcGx1czogZmFsc2UqL1xuLypnbG9iYWwgbW9kdWxlLCByZXF1aXJlLCBfX2Rpcm5hbWUsIGRvY3VtZW50Ki9cbi8qKlxuICogU2lub24gY29yZSB1dGlsaXRpZXMuIEZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIHNpbm9uID0gKGZ1bmN0aW9uIChmb3JtYXRpbykge1xuICAgIHZhciBkaXYgPSB0eXBlb2YgZG9jdW1lbnQgIT0gXCJ1bmRlZmluZWRcIiAmJiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4gICAgZnVuY3Rpb24gaXNET01Ob2RlKG9iaikge1xuICAgICAgICB2YXIgc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvYmouYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgIHN1Y2Nlc3MgPSBkaXYucGFyZW50Tm9kZSA9PSBvYmo7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgb2JqLnJlbW92ZUNoaWxkKGRpdik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZhaWxlZCwgbm90IG11Y2ggd2UgY2FuIGRvIGFib3V0IHRoYXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdWNjZXNzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRWxlbWVudChvYmopIHtcbiAgICAgICAgcmV0dXJuIGRpdiAmJiBvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxICYmIGlzRE9NTm9kZShvYmopO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIgfHwgISEob2JqICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY2FsbCAmJiBvYmouYXBwbHkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pcnJvclByb3BlcnRpZXModGFyZ2V0LCBzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwodGFyZ2V0LCBwcm9wKSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUmVzdG9yYWJsZSAob2JqKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIG9iai5yZXN0b3JlID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLnJlc3RvcmUuc2lub247XG4gICAgfVxuXG4gICAgdmFyIHNpbm9uID0ge1xuICAgICAgICB3cmFwTWV0aG9kOiBmdW5jdGlvbiB3cmFwTWV0aG9kKG9iamVjdCwgcHJvcGVydHksIG1ldGhvZCkge1xuICAgICAgICAgICAgaWYgKCFvYmplY3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU2hvdWxkIHdyYXAgcHJvcGVydHkgb2Ygb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTWV0aG9kIHdyYXBwZXIgc2hvdWxkIGJlIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgd3JhcHBlZE1ldGhvZCA9IG9iamVjdFtwcm9wZXJ0eV0sXG4gICAgICAgICAgICAgICAgZXJyb3I7XG5cbiAgICAgICAgICAgIGlmICghaXNGdW5jdGlvbih3cmFwcGVkTWV0aG9kKSkge1xuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IFR5cGVFcnJvcihcIkF0dGVtcHRlZCB0byB3cmFwIFwiICsgKHR5cGVvZiB3cmFwcGVkTWV0aG9kKSArIFwiIHByb3BlcnR5IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ICsgXCIgYXMgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3cmFwcGVkTWV0aG9kLnJlc3RvcmUgJiYgd3JhcHBlZE1ldGhvZC5yZXN0b3JlLnNpbm9uKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiQXR0ZW1wdGVkIHRvIHdyYXAgXCIgKyBwcm9wZXJ0eSArIFwiIHdoaWNoIGlzIGFscmVhZHkgd3JhcHBlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHdyYXBwZWRNZXRob2QuY2FsbGVkQmVmb3JlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZlcmIgPSAhIXdyYXBwZWRNZXRob2QucmV0dXJucyA/IFwic3R1YmJlZFwiIDogXCJzcGllZCBvblwiO1xuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IFR5cGVFcnJvcihcIkF0dGVtcHRlZCB0byB3cmFwIFwiICsgcHJvcGVydHkgKyBcIiB3aGljaCBpcyBhbHJlYWR5IFwiICsgdmVyYik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmICh3cmFwcGVkTWV0aG9kLl9zdGFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvci5zdGFjayArPSAnXFxuLS0tLS0tLS0tLS0tLS1cXG4nICsgd3JhcHBlZE1ldGhvZC5fc3RhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJRSA4IGRvZXMgbm90IHN1cHBvcnQgaGFzT3duUHJvcGVydHkgb24gdGhlIHdpbmRvdyBvYmplY3QgYW5kIEZpcmVmb3ggaGFzIGEgcHJvYmxlbVxuICAgICAgICAgICAgLy8gd2hlbiB1c2luZyBoYXNPd24uY2FsbCBvbiBvYmplY3RzIGZyb20gb3RoZXIgZnJhbWVzLlxuICAgICAgICAgICAgdmFyIG93bmVkID0gb2JqZWN0Lmhhc093blByb3BlcnR5ID8gb2JqZWN0Lmhhc093blByb3BlcnR5KHByb3BlcnR5KSA6IGhhc093bi5jYWxsKG9iamVjdCwgcHJvcGVydHkpO1xuICAgICAgICAgICAgb2JqZWN0W3Byb3BlcnR5XSA9IG1ldGhvZDtcbiAgICAgICAgICAgIG1ldGhvZC5kaXNwbGF5TmFtZSA9IHByb3BlcnR5O1xuICAgICAgICAgICAgLy8gU2V0IHVwIGEgc3RhY2sgdHJhY2Ugd2hpY2ggY2FuIGJlIHVzZWQgbGF0ZXIgdG8gZmluZCB3aGF0IGxpbmUgb2ZcbiAgICAgICAgICAgIC8vIGNvZGUgdGhlIG9yaWdpbmFsIG1ldGhvZCB3YXMgY3JlYXRlZCBvbi5cbiAgICAgICAgICAgIG1ldGhvZC5fc3RhY2sgPSAobmV3IEVycm9yKCdTdGFjayBUcmFjZSBmb3Igb3JpZ2luYWwnKSkuc3RhY2s7XG5cbiAgICAgICAgICAgIG1ldGhvZC5yZXN0b3JlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIEZvciBwcm90b3R5cGUgcHJvcGVydGllcyB0cnkgdG8gcmVzZXQgYnkgZGVsZXRlIGZpcnN0LlxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgZmFpbHMgKGV4OiBsb2NhbFN0b3JhZ2Ugb24gbW9iaWxlIHNhZmFyaSkgdGhlbiBmb3JjZSBhIHJlc2V0XG4gICAgICAgICAgICAgICAgLy8gdmlhIGRpcmVjdCBhc3NpZ25tZW50LlxuICAgICAgICAgICAgICAgIGlmICghb3duZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvYmplY3RbcHJvcGVydHldID09PSBtZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0W3Byb3BlcnR5XSA9IHdyYXBwZWRNZXRob2Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbWV0aG9kLnJlc3RvcmUuc2lub24gPSB0cnVlO1xuICAgICAgICAgICAgbWlycm9yUHJvcGVydGllcyhtZXRob2QsIHdyYXBwZWRNZXRob2QpO1xuXG4gICAgICAgICAgICByZXR1cm4gbWV0aG9kO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4dGVuZDogZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDEsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gYXJndW1lbnRzW2ldW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRE9OVCBFTlVNIGJ1Zywgb25seSBjYXJlIGFib3V0IHRvU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoXCJ0b1N0cmluZ1wiKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzW2ldLnRvU3RyaW5nICE9IHRhcmdldC50b1N0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnRvU3RyaW5nID0gYXJndW1lbnRzW2ldLnRvU3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKHByb3RvKSB7XG4gICAgICAgICAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgICAgICAgICAgIHJldHVybiBuZXcgRigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlZXBFcXVhbDogZnVuY3Rpb24gZGVlcEVxdWFsKGEsIGIpIHtcbiAgICAgICAgICAgIGlmIChzaW5vbi5tYXRjaCAmJiBzaW5vbi5tYXRjaC5pc01hdGNoZXIoYSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS50ZXN0KGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhICE9IFwib2JqZWN0XCIgfHwgdHlwZW9mIGIgIT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGEpIHx8IGlzRWxlbWVudChiKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoKGEgPT09IG51bGwgJiYgYiAhPT0gbnVsbCkgfHwgKGEgIT09IG51bGwgJiYgYiA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpO1xuICAgICAgICAgICAgaWYgKGFTdHJpbmcgIT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYVN0cmluZyA9PSBcIltvYmplY3QgRGF0ZV1cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcm9wLCBhTGVuZ3RoID0gMCwgYkxlbmd0aCA9IDA7XG5cbiAgICAgICAgICAgIGlmIChhU3RyaW5nID09IFwiW29iamVjdCBBcnJheV1cIiAmJiBhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAocHJvcCBpbiBhKSB7XG4gICAgICAgICAgICAgICAgYUxlbmd0aCArPSAxO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFkZWVwRXF1YWwoYVtwcm9wXSwgYltwcm9wXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChwcm9wIGluIGIpIHtcbiAgICAgICAgICAgICAgICBiTGVuZ3RoICs9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhTGVuZ3RoID09IGJMZW5ndGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZnVuY3Rpb25OYW1lOiBmdW5jdGlvbiBmdW5jdGlvbk5hbWUoZnVuYykge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBmdW5jLmRpc3BsYXlOYW1lIHx8IGZ1bmMubmFtZTtcblxuICAgICAgICAgICAgLy8gVXNlIGZ1bmN0aW9uIGRlY29tcG9zaXRpb24gYXMgYSBsYXN0IHJlc29ydCB0byBnZXQgZnVuY3Rpb25cbiAgICAgICAgICAgIC8vIG5hbWUuIERvZXMgbm90IHJlbHkgb24gZnVuY3Rpb24gZGVjb21wb3NpdGlvbiB0byB3b3JrIC0gaWYgaXRcbiAgICAgICAgICAgIC8vIGRvZXNuJ3QgZGVidWdnaW5nIHdpbGwgYmUgc2xpZ2h0bHkgbGVzcyBpbmZvcm1hdGl2ZVxuICAgICAgICAgICAgLy8gKGkuZS4gdG9TdHJpbmcgd2lsbCBzYXkgJ3NweScgcmF0aGVyIHRoYW4gJ215RnVuYycpLlxuICAgICAgICAgICAgaWYgKCFuYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBmdW5jLnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uIChbXlxcc1xcKF0rKS8pO1xuICAgICAgICAgICAgICAgIG5hbWUgPSBtYXRjaGVzICYmIG1hdGNoZXNbMV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZ1bmN0aW9uVG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q2FsbCAmJiB0aGlzLmNhbGxDb3VudCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGlzVmFsdWUsIHByb3AsIGkgPSB0aGlzLmNhbGxDb3VudDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1ZhbHVlID0gdGhpcy5nZXRDYWxsKGkpLnRoaXNWYWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHByb3AgaW4gdGhpc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc1ZhbHVlW3Byb3BdID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlOYW1lIHx8IFwic2lub24gZmFrZVwiO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldENvbmZpZzogZnVuY3Rpb24gKGN1c3RvbSkge1xuICAgICAgICAgICAgdmFyIGNvbmZpZyA9IHt9O1xuICAgICAgICAgICAgY3VzdG9tID0gY3VzdG9tIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGRlZmF1bHRzID0gc2lub24uZGVmYXVsdENvbmZpZztcblxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBkZWZhdWx0cykge1xuICAgICAgICAgICAgICAgIGlmIChkZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWdbcHJvcF0gPSBjdXN0b20uaGFzT3duUHJvcGVydHkocHJvcCkgPyBjdXN0b21bcHJvcF0gOiBkZWZhdWx0c1twcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIHZhbDtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWZhdWx0Q29uZmlnOiB7XG4gICAgICAgICAgICBpbmplY3RJbnRvVGhpczogdHJ1ZSxcbiAgICAgICAgICAgIGluamVjdEludG86IG51bGwsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXCJzcHlcIiwgXCJzdHViXCIsIFwibW9ja1wiLCBcImNsb2NrXCIsIFwic2VydmVyXCIsIFwicmVxdWVzdHNcIl0sXG4gICAgICAgICAgICB1c2VGYWtlVGltZXJzOiB0cnVlLFxuICAgICAgICAgICAgdXNlRmFrZVNlcnZlcjogdHJ1ZVxuICAgICAgICB9LFxuXG4gICAgICAgIHRpbWVzSW5Xb3JkczogZnVuY3Rpb24gdGltZXNJbldvcmRzKGNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gY291bnQgPT0gMSAmJiBcIm9uY2VcIiB8fFxuICAgICAgICAgICAgICAgIGNvdW50ID09IDIgJiYgXCJ0d2ljZVwiIHx8XG4gICAgICAgICAgICAgICAgY291bnQgPT0gMyAmJiBcInRocmljZVwiIHx8XG4gICAgICAgICAgICAgICAgKGNvdW50IHx8IDApICsgXCIgdGltZXNcIjtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsZWRJbk9yZGVyOiBmdW5jdGlvbiAoc3BpZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxLCBsID0gc3BpZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzcGllc1tpIC0gMV0uY2FsbGVkQmVmb3JlKHNwaWVzW2ldKSB8fCAhc3BpZXNbaV0uY2FsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9yZGVyQnlGaXJzdENhbGw6IGZ1bmN0aW9uIChzcGllcykge1xuICAgICAgICAgICAgcmV0dXJuIHNwaWVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAvLyB1dWlkLCB3b24ndCBldmVyIGJlIGVxdWFsXG4gICAgICAgICAgICAgICAgdmFyIGFDYWxsID0gYS5nZXRDYWxsKDApO1xuICAgICAgICAgICAgICAgIHZhciBiQ2FsbCA9IGIuZ2V0Q2FsbCgwKTtcbiAgICAgICAgICAgICAgICB2YXIgYUlkID0gYUNhbGwgJiYgYUNhbGwuY2FsbElkIHx8IC0xO1xuICAgICAgICAgICAgICAgIHZhciBiSWQgPSBiQ2FsbCAmJiBiQ2FsbC5jYWxsSWQgfHwgLTE7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYUlkIDwgYklkID8gLTEgOiAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9nOiBmdW5jdGlvbiAoKSB7fSxcblxuICAgICAgICBsb2dFcnJvcjogZnVuY3Rpb24gKGxhYmVsLCBlcnIpIHtcbiAgICAgICAgICAgIHZhciBtc2cgPSBsYWJlbCArIFwiIHRocmV3IGV4Y2VwdGlvbjogXCI7XG4gICAgICAgICAgICBzaW5vbi5sb2cobXNnICsgXCJbXCIgKyBlcnIubmFtZSArIFwiXSBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhY2spIHsgc2lub24ubG9nKGVyci5zdGFjayk7IH1cblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSBtc2cgKyBlcnIubWVzc2FnZTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0eXBlT2Y6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcInVuZGVmaW5lZFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5nLnN1YnN0cmluZyg4LCBzdHJpbmcubGVuZ3RoIC0gMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVTdHViSW5zdGFuY2U6IGZ1bmN0aW9uIChjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zdHJ1Y3RvciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBjb25zdHJ1Y3RvciBzaG91bGQgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2lub24uc3R1YihzaW5vbi5jcmVhdGUoY29uc3RydWN0b3IucHJvdG90eXBlKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzdG9yZTogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVzdG9yYWJsZShvYmplY3RbcHJvcF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbcHJvcF0ucmVzdG9yZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNSZXN0b3JhYmxlKG9iamVjdCkpIHtcbiAgICAgICAgICAgICAgICBvYmplY3QucmVzdG9yZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBpc05vZGUgPSB0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzO1xuICAgIHZhciBpc0FNRCA9IHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQ7XG5cbiAgICBpZiAoaXNBTUQpIHtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gc2lub247XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoaXNOb2RlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3JtYXRpbyA9IHJlcXVpcmUoXCJmb3JtYXRpb1wiKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzaW5vbjtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuc3B5ID0gcmVxdWlyZShcIi4vc2lub24vc3B5XCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5zcHlDYWxsID0gcmVxdWlyZShcIi4vc2lub24vY2FsbFwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuYmVoYXZpb3IgPSByZXF1aXJlKFwiLi9zaW5vbi9iZWhhdmlvclwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuc3R1YiA9IHJlcXVpcmUoXCIuL3Npbm9uL3N0dWJcIik7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLm1vY2sgPSByZXF1aXJlKFwiLi9zaW5vbi9tb2NrXCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb2xsZWN0aW9uID0gcmVxdWlyZShcIi4vc2lub24vY29sbGVjdGlvblwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuYXNzZXJ0ID0gcmVxdWlyZShcIi4vc2lub24vYXNzZXJ0XCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5zYW5kYm94ID0gcmVxdWlyZShcIi4vc2lub24vc2FuZGJveFwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMudGVzdCA9IHJlcXVpcmUoXCIuL3Npbm9uL3Rlc3RcIik7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLnRlc3RDYXNlID0gcmVxdWlyZShcIi4vc2lub24vdGVzdF9jYXNlXCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5hc3NlcnQgPSByZXF1aXJlKFwiLi9zaW5vbi9hc3NlcnRcIik7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLm1hdGNoID0gcmVxdWlyZShcIi4vc2lub24vbWF0Y2hcIik7XG4gICAgfVxuXG4gICAgaWYgKGZvcm1hdGlvKSB7XG4gICAgICAgIHZhciBmb3JtYXR0ZXIgPSBmb3JtYXRpby5jb25maWd1cmUoeyBxdW90ZVN0cmluZ3M6IGZhbHNlIH0pO1xuICAgICAgICBzaW5vbi5mb3JtYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmFzY2lpLmFwcGx5KGZvcm1hdHRlciwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGlzTm9kZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcbiAgICAgICAgICAgIHNpbm9uLmZvcm1hdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZS50b1N0cmluZyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyA/IHV0aWwuaW5zcGVjdCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8qIE5vZGUsIGJ1dCBubyB1dGlsIG1vZHVsZSAtIHdvdWxkIGJlIHZlcnkgb2xkLCBidXQgYmV0dGVyIHNhZmUgdGhhblxuICAgICAgICAgICAgIHNvcnJ5ICovXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2lub247XG59KHR5cGVvZiBmb3JtYXRpbyA9PSBcIm9iamVjdFwiICYmIGZvcm1hdGlvKSk7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKipcbiAqIEBkZXBlbmQgLi4vc2lub24uanNcbiAqIEBkZXBlbmQgc3R1Yi5qc1xuICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlLCBub21lbjogZmFsc2UsIHBsdXNwbHVzOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICogQXNzZXJ0aW9ucyBtYXRjaGluZyB0aGUgdGVzdCBzcHkgcmV0cmlldmFsIGludGVyZmFjZS5cbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuKGZ1bmN0aW9uIChzaW5vbiwgZ2xvYmFsKSB7XG4gICAgdmFyIGNvbW1vbkpTTW9kdWxlID0gdHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cztcbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgdmFyIGFzc2VydDtcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmVyaWZ5SXNTdHViKCkge1xuICAgICAgICB2YXIgbWV0aG9kO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgbWV0aG9kID0gYXJndW1lbnRzW2ldO1xuXG4gICAgICAgICAgICBpZiAoIW1ldGhvZCkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5mYWlsKFwiZmFrZSBpcyBub3QgYSBzcHlcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGFzc2VydC5mYWlsKG1ldGhvZCArIFwiIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZC5nZXRDYWxsICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGFzc2VydC5mYWlsKG1ldGhvZCArIFwiIGlzIG5vdCBzdHViYmVkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmFpbEFzc2VydGlvbihvYmplY3QsIG1zZykge1xuICAgICAgICBvYmplY3QgPSBvYmplY3QgfHwgZ2xvYmFsO1xuICAgICAgICB2YXIgZmFpbE1ldGhvZCA9IG9iamVjdC5mYWlsIHx8IGFzc2VydC5mYWlsO1xuICAgICAgICBmYWlsTWV0aG9kLmNhbGwob2JqZWN0LCBtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pcnJvclByb3BBc0Fzc2VydGlvbihuYW1lLCBtZXRob2QsIG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgbWVzc2FnZSA9IG1ldGhvZDtcbiAgICAgICAgICAgIG1ldGhvZCA9IG5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBhc3NlcnRbbmFtZV0gPSBmdW5jdGlvbiAoZmFrZSkge1xuICAgICAgICAgICAgdmVyaWZ5SXNTdHViKGZha2UpO1xuXG4gICAgICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgIHZhciBmYWlsZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgZmFpbGVkID0gIW1ldGhvZChmYWtlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmFpbGVkID0gdHlwZW9mIGZha2VbbWV0aG9kXSA9PSBcImZ1bmN0aW9uXCIgP1xuICAgICAgICAgICAgICAgICAgICAhZmFrZVttZXRob2RdLmFwcGx5KGZha2UsIGFyZ3MpIDogIWZha2VbbWV0aG9kXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZhaWxlZCkge1xuICAgICAgICAgICAgICAgIGZhaWxBc3NlcnRpb24odGhpcywgZmFrZS5wcmludGYuYXBwbHkoZmFrZSwgW21lc3NhZ2VdLmNvbmNhdChhcmdzKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhc3NlcnQucGFzcyhuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBvc2VkTmFtZShwcmVmaXgsIHByb3ApIHtcbiAgICAgICAgcmV0dXJuICFwcmVmaXggfHwgL15mYWlsLy50ZXN0KHByb3ApID8gcHJvcCA6XG4gICAgICAgICAgICBwcmVmaXggKyBwcm9wLnNsaWNlKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIGFzc2VydCA9IHtcbiAgICAgICAgZmFpbEV4Y2VwdGlvbjogXCJBc3NlcnRFcnJvclwiLFxuXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uIGZhaWwobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgZXJyb3IubmFtZSA9IHRoaXMuZmFpbEV4Y2VwdGlvbiB8fCBhc3NlcnQuZmFpbEV4Y2VwdGlvbjtcblxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFzczogZnVuY3Rpb24gcGFzcyhhc3NlcnRpb24pIHt9LFxuXG4gICAgICAgIGNhbGxPcmRlcjogZnVuY3Rpb24gYXNzZXJ0Q2FsbE9yZGVyKCkge1xuICAgICAgICAgICAgdmVyaWZ5SXNTdHViLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB2YXIgZXhwZWN0ZWQgPSBcIlwiLCBhY3R1YWwgPSBcIlwiO1xuXG4gICAgICAgICAgICBpZiAoIXNpbm9uLmNhbGxlZEluT3JkZXIoYXJndW1lbnRzKSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkID0gW10uam9pbi5jYWxsKGFyZ3VtZW50cywgXCIsIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbGxzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IGNhbGxzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2FsbHNbLS1pXS5jYWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxscy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsID0gc2lub24ub3JkZXJCeUZpcnN0Q2FsbChjYWxscykuam9pbihcIiwgXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBmYWlscywgd2UnbGwganVzdCBmYWxsIGJhY2sgdG8gdGhlIGJsYW5rIHN0cmluZ1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZhaWxBc3NlcnRpb24odGhpcywgXCJleHBlY3RlZCBcIiArIGV4cGVjdGVkICsgXCIgdG8gYmUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjYWxsZWQgaW4gb3JkZXIgYnV0IHdlcmUgY2FsbGVkIGFzIFwiICsgYWN0dWFsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LnBhc3MoXCJjYWxsT3JkZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbENvdW50OiBmdW5jdGlvbiBhc3NlcnRDYWxsQ291bnQobWV0aG9kLCBjb3VudCkge1xuICAgICAgICAgICAgdmVyaWZ5SXNTdHViKG1ldGhvZCk7XG5cbiAgICAgICAgICAgIGlmIChtZXRob2QuY2FsbENvdW50ICE9IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiZXhwZWN0ZWQgJW4gdG8gYmUgY2FsbGVkIFwiICsgc2lub24udGltZXNJbldvcmRzKGNvdW50KSArXG4gICAgICAgICAgICAgICAgICAgIFwiIGJ1dCB3YXMgY2FsbGVkICVjJUNcIjtcbiAgICAgICAgICAgICAgICBmYWlsQXNzZXJ0aW9uKHRoaXMsIG1ldGhvZC5wcmludGYobXNnKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFzc2VydC5wYXNzKFwiY2FsbENvdW50XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV4cG9zZTogZnVuY3Rpb24gZXhwb3NlKHRhcmdldCwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidGFyZ2V0IGlzIG51bGwgb3IgdW5kZWZpbmVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgcHJlZml4ID0gdHlwZW9mIG8ucHJlZml4ID09IFwidW5kZWZpbmVkXCIgJiYgXCJhc3NlcnRcIiB8fCBvLnByZWZpeDtcbiAgICAgICAgICAgIHZhciBpbmNsdWRlRmFpbCA9IHR5cGVvZiBvLmluY2x1ZGVGYWlsID09IFwidW5kZWZpbmVkXCIgfHwgISFvLmluY2x1ZGVGYWlsO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBtZXRob2QgaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGlmIChtZXRob2QgIT0gXCJleHBvcnRcIiAmJiAoaW5jbHVkZUZhaWwgfHwgIS9eKGZhaWwpLy50ZXN0KG1ldGhvZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtleHBvc2VkTmFtZShwcmVmaXgsIG1ldGhvZCldID0gdGhpc1ttZXRob2RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJjYWxsZWRcIiwgXCJleHBlY3RlZCAlbiB0byBoYXZlIGJlZW4gY2FsbGVkIGF0IGxlYXN0IG9uY2UgYnV0IHdhcyBuZXZlciBjYWxsZWRcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwibm90Q2FsbGVkXCIsIGZ1bmN0aW9uIChzcHkpIHsgcmV0dXJuICFzcHkuY2FsbGVkOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcImV4cGVjdGVkICVuIHRvIG5vdCBoYXZlIGJlZW4gY2FsbGVkIGJ1dCB3YXMgY2FsbGVkICVjJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkT25jZVwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCBvbmNlIGJ1dCB3YXMgY2FsbGVkICVjJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkVHdpY2VcIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgdHdpY2UgYnV0IHdhcyBjYWxsZWQgJWMlQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJjYWxsZWRUaHJpY2VcIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgdGhyaWNlIGJ1dCB3YXMgY2FsbGVkICVjJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkT25cIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgd2l0aCAlMSBhcyB0aGlzIGJ1dCB3YXMgY2FsbGVkIHdpdGggJXRcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzQ2FsbGVkT25cIiwgXCJleHBlY3RlZCAlbiB0byBhbHdheXMgYmUgY2FsbGVkIHdpdGggJTEgYXMgdGhpcyBidXQgd2FzIGNhbGxlZCB3aXRoICV0XCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcImNhbGxlZFdpdGhOZXdcIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgd2l0aCBuZXdcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzQ2FsbGVkV2l0aE5ld1wiLCBcImV4cGVjdGVkICVuIHRvIGFsd2F5cyBiZSBjYWxsZWQgd2l0aCBuZXdcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkV2l0aFwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCB3aXRoIGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcImNhbGxlZFdpdGhNYXRjaFwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCB3aXRoIG1hdGNoICUqJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzQ2FsbGVkV2l0aFwiLCBcImV4cGVjdGVkICVuIHRvIGFsd2F5cyBiZSBjYWxsZWQgd2l0aCBhcmd1bWVudHMgJSolQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJhbHdheXNDYWxsZWRXaXRoTWF0Y2hcIiwgXCJleHBlY3RlZCAlbiB0byBhbHdheXMgYmUgY2FsbGVkIHdpdGggbWF0Y2ggJSolQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJjYWxsZWRXaXRoRXhhY3RseVwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCB3aXRoIGV4YWN0IGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcImFsd2F5c0NhbGxlZFdpdGhFeGFjdGx5XCIsIFwiZXhwZWN0ZWQgJW4gdG8gYWx3YXlzIGJlIGNhbGxlZCB3aXRoIGV4YWN0IGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcIm5ldmVyQ2FsbGVkV2l0aFwiLCBcImV4cGVjdGVkICVuIHRvIG5ldmVyIGJlIGNhbGxlZCB3aXRoIGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcIm5ldmVyQ2FsbGVkV2l0aE1hdGNoXCIsIFwiZXhwZWN0ZWQgJW4gdG8gbmV2ZXIgYmUgY2FsbGVkIHdpdGggbWF0Y2ggJSolQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJ0aHJld1wiLCBcIiVuIGRpZCBub3QgdGhyb3cgZXhjZXB0aW9uJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzVGhyZXdcIiwgXCIlbiBkaWQgbm90IGFsd2F5cyB0aHJvdyBleGNlcHRpb24lQ1wiKTtcblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzc2VydDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi5hc3NlcnQgPSBhc3NlcnQ7XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsLCB0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiAodHlwZW9mIHNlbGYgIT0gXCJ1bmRlZmluZWRcIikgPyBzZWxmIDogZ2xvYmFsKSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qKlxuICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24sIHByb2Nlc3MsIHNldEltbWVkaWF0ZSwgc2V0VGltZW91dCovXG4vKipcbiAqIFN0dWIgYmVoYXZpb3JcbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBhdXRob3IgVGltIEZpc2NoYmFjaCAobWFpbEB0aW1maXNjaGJhY2guZGUpXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuICAgIHZhciBqb2luID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG4gICAgdmFyIHByb3RvO1xuXG4gICAgdmFyIG5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIHNldEltbWVkaWF0ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgZnVuY3Rpb24gdGhyb3dzRXhjZXB0aW9uKGVycm9yLCBtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZXJyb3IgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5leGNlcHRpb24gPSBuZXcgRXJyb3IobWVzc2FnZSB8fCBcIlwiKTtcbiAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9uLm5hbWUgPSBlcnJvcjtcbiAgICAgICAgfSBlbHNlIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9uID0gbmV3IEVycm9yKFwiRXJyb3JcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV4Y2VwdGlvbiA9IGVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2FsbGJhY2soYmVoYXZpb3IsIGFyZ3MpIHtcbiAgICAgICAgdmFyIGNhbGxBcmdBdCA9IGJlaGF2aW9yLmNhbGxBcmdBdDtcblxuICAgICAgICBpZiAoY2FsbEFyZ0F0IDwgMCkge1xuICAgICAgICAgICAgdmFyIGNhbGxBcmdQcm9wID0gYmVoYXZpb3IuY2FsbEFyZ1Byb3A7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXJncy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNhbGxBcmdQcm9wICYmIHR5cGVvZiBhcmdzW2ldID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1tpXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY2FsbEFyZ1Byb3AgJiYgYXJnc1tpXSAmJlxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgYXJnc1tpXVtjYWxsQXJnUHJvcF0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmdzW2ldW2NhbGxBcmdQcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFyZ3NbY2FsbEFyZ0F0XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDYWxsYmFja0Vycm9yKGJlaGF2aW9yLCBmdW5jLCBhcmdzKSB7XG4gICAgICAgIGlmIChiZWhhdmlvci5jYWxsQXJnQXQgPCAwKSB7XG4gICAgICAgICAgICB2YXIgbXNnO1xuXG4gICAgICAgICAgICBpZiAoYmVoYXZpb3IuY2FsbEFyZ1Byb3ApIHtcbiAgICAgICAgICAgICAgICBtc2cgPSBzaW5vbi5mdW5jdGlvbk5hbWUoYmVoYXZpb3Iuc3R1YikgK1xuICAgICAgICAgICAgICAgICAgICBcIiBleHBlY3RlZCB0byB5aWVsZCB0byAnXCIgKyBiZWhhdmlvci5jYWxsQXJnUHJvcCArXG4gICAgICAgICAgICAgICAgICAgIFwiJywgYnV0IG5vIG9iamVjdCB3aXRoIHN1Y2ggYSBwcm9wZXJ0eSB3YXMgcGFzc2VkLlwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cgPSBzaW5vbi5mdW5jdGlvbk5hbWUoYmVoYXZpb3Iuc3R1YikgK1xuICAgICAgICAgICAgICAgICAgICBcIiBleHBlY3RlZCB0byB5aWVsZCwgYnV0IG5vIGNhbGxiYWNrIHdhcyBwYXNzZWQuXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBtc2cgKz0gXCIgUmVjZWl2ZWQgW1wiICsgam9pbi5jYWxsKGFyZ3MsIFwiLCBcIikgKyBcIl1cIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1zZztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBcImFyZ3VtZW50IGF0IGluZGV4IFwiICsgYmVoYXZpb3IuY2FsbEFyZ0F0ICsgXCIgaXMgbm90IGEgZnVuY3Rpb246IFwiICsgZnVuYztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxsQ2FsbGJhY2soYmVoYXZpb3IsIGFyZ3MpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBiZWhhdmlvci5jYWxsQXJnQXQgPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdmFyIGZ1bmMgPSBnZXRDYWxsYmFjayhiZWhhdmlvciwgYXJncyk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGdldENhbGxiYWNrRXJyb3IoYmVoYXZpb3IsIGZ1bmMsIGFyZ3MpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGJlaGF2aW9yLmNhbGxiYWNrQXN5bmMpIHtcbiAgICAgICAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseShiZWhhdmlvci5jYWxsYmFja0NvbnRleHQsIGJlaGF2aW9yLmNhbGxiYWNrQXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnVuYy5hcHBseShiZWhhdmlvci5jYWxsYmFja0NvbnRleHQsIGJlaGF2aW9yLmNhbGxiYWNrQXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RvID0ge1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uKHN0dWIpIHtcbiAgICAgICAgICAgIHZhciBiZWhhdmlvciA9IHNpbm9uLmV4dGVuZCh7fSwgc2lub24uYmVoYXZpb3IpO1xuICAgICAgICAgICAgZGVsZXRlIGJlaGF2aW9yLmNyZWF0ZTtcbiAgICAgICAgICAgIGJlaGF2aW9yLnN0dWIgPSBzdHViO1xuXG4gICAgICAgICAgICByZXR1cm4gYmVoYXZpb3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNQcmVzZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHRoaXMuY2FsbEFyZ0F0ID09ICdudW1iZXInIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9uIHx8XG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0aGlzLnJldHVybkFyZ0F0ID09ICdudW1iZXInIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuVGhpcyB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlRGVmaW5lZCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52b2tlOiBmdW5jdGlvbihjb250ZXh0LCBhcmdzKSB7XG4gICAgICAgICAgICBjYWxsQ2FsbGJhY2sodGhpcywgYXJncyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuZXhjZXB0aW9uO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5yZXR1cm5BcmdBdCA9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcmdzW3RoaXMucmV0dXJuQXJnQXRdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJldHVyblRoaXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmV0dXJuVmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DYWxsOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3R1Yi5vbkNhbGwoaW5kZXgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRmlyc3RDYWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0dWIub25GaXJzdENhbGwoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblNlY29uZENhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3R1Yi5vblNlY29uZENhbGwoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblRoaXJkQ2FsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdHViLm9uVGhpcmRDYWxsKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2l0aEFyZ3M6IGZ1bmN0aW9uKC8qIGFyZ3VtZW50cyAqLykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWZpbmluZyBhIHN0dWIgYnkgaW52b2tpbmcgXCJzdHViLm9uQ2FsbCguLi4pLndpdGhBcmdzKC4uLilcIiBpcyBub3Qgc3VwcG9ydGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnVXNlIFwic3R1Yi53aXRoQXJncyguLi4pLm9uQ2FsbCguLi4pXCIgdG8gZGVmaW5lIHNlcXVlbnRpYWwgYmVoYXZpb3IgZm9yIGNhbGxzIHdpdGggY2VydGFpbiBhcmd1bWVudHMuJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbHNBcmc6IGZ1bmN0aW9uIGNhbGxzQXJnKHBvcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb3MgIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBpbmRleCBpcyBub3QgbnVtYmVyXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IHBvcztcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnUHJvcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsc0FyZ09uOiBmdW5jdGlvbiBjYWxsc0FyZ09uKHBvcywgY29udGV4dCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb3MgIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBpbmRleCBpcyBub3QgbnVtYmVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgY29udGV4dCBpcyBub3QgYW4gb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IHBvcztcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ1Byb3AgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXN5bmMgPSBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbHNBcmdXaXRoOiBmdW5jdGlvbiBjYWxsc0FyZ1dpdGgocG9zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvcyAhPSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFyZ3VtZW50IGluZGV4IGlzIG5vdCBudW1iZXJcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ0F0ID0gcG9zO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FyZ3VtZW50cyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnUHJvcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsc0FyZ09uV2l0aDogZnVuY3Rpb24gY2FsbHNBcmdXaXRoKHBvcywgY29udGV4dCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb3MgIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBpbmRleCBpcyBub3QgbnVtYmVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgY29udGV4dCBpcyBub3QgYW4gb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IHBvcztcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQ29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdQcm9wID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FzeW5jID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHlpZWxkczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnQXQgPSAtMTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQ29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ1Byb3AgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXN5bmMgPSBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgeWllbGRzT246IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBjb250ZXh0IGlzIG5vdCBhbiBvYmplY3RcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ0F0ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJndW1lbnRzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnUHJvcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICB5aWVsZHNUbzogZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ0F0ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJndW1lbnRzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0NvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdQcm9wID0gcHJvcDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICB5aWVsZHNUb09uOiBmdW5jdGlvbiAocHJvcCwgY29udGV4dCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgY29udGV4dCBpcyBub3QgYW4gb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IC0xO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FyZ3VtZW50cyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ1Byb3AgPSBwcm9wO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FzeW5jID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgXCJ0aHJvd3NcIjogdGhyb3dzRXhjZXB0aW9uLFxuICAgICAgICB0aHJvd3NFeGNlcHRpb246IHRocm93c0V4Y2VwdGlvbixcblxuICAgICAgICByZXR1cm5zOiBmdW5jdGlvbiByZXR1cm5zKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlRGVmaW5lZCA9IHRydWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJldHVybnNBcmc6IGZ1bmN0aW9uIHJldHVybnNBcmcocG9zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvcyAhPSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFyZ3VtZW50IGluZGV4IGlzIG5vdCBudW1iZXJcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucmV0dXJuQXJnQXQgPSBwb3M7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJldHVybnNUaGlzOiBmdW5jdGlvbiByZXR1cm5zVGhpcygpIHtcbiAgICAgICAgICAgIHRoaXMucmV0dXJuVGhpcyA9IHRydWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGNyZWF0ZSBhc3luY2hyb25vdXMgdmVyc2lvbnMgb2YgY2FsbHNBcmcqIGFuZCB5aWVsZHMqIG1ldGhvZHNcbiAgICBmb3IgKHZhciBtZXRob2QgaW4gcHJvdG8pIHtcbiAgICAgICAgLy8gbmVlZCB0byBhdm9pZCBjcmVhdGluZyBhbm90aGVyYXN5bmMgdmVyc2lvbnMgb2YgdGhlIG5ld2x5IGFkZGVkIGFzeW5jIG1ldGhvZHNcbiAgICAgICAgaWYgKHByb3RvLmhhc093blByb3BlcnR5KG1ldGhvZCkgJiZcbiAgICAgICAgICAgIG1ldGhvZC5tYXRjaCgvXihjYWxsc0FyZ3x5aWVsZHMpLykgJiZcbiAgICAgICAgICAgICFtZXRob2QubWF0Y2goL0FzeW5jLykpIHtcbiAgICAgICAgICAgIHByb3RvW21ldGhvZCArICdBc3luYyddID0gKGZ1bmN0aW9uIChzeW5jRm5OYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXNbc3luY0ZuTmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkobWV0aG9kKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHByb3RvO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbm9uLmJlaGF2aW9yID0gcHJvdG87XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsKSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIkprcFIyRlwiKSkiLCIvKipcbiAgKiBAZGVwZW5kIC4uL3Npbm9uLmpzXG4gICogQGRlcGVuZCBtYXRjaC5qc1xuICAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgcGx1c3BsdXM6IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24qL1xuLyoqXG4gICogU3B5IGNhbGxzXG4gICpcbiAgKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAgKiBAYXV0aG9yIE1heGltaWxpYW4gQW50b25pIChtYWlsQG1heGFudG9uaS5kZSlcbiAgKiBAbGljZW5zZSBCU0RcbiAgKlxuICAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICAqIENvcHlyaWdodCAoYykgMjAxMyBNYXhpbWlsaWFuIEFudG9uaVxuICAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcbiAgICBpZiAoIXNpbm9uICYmIGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIHNpbm9uID0gcmVxdWlyZShcIi4uL3Npbm9uXCIpO1xuICAgIH1cblxuICAgIGlmICghc2lub24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRocm93WWllbGRFcnJvcihwcm94eSwgdGV4dCwgYXJncykge1xuICAgICAgICB2YXIgbXNnID0gc2lub24uZnVuY3Rpb25OYW1lKHByb3h5KSArIHRleHQ7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgbXNnICs9IFwiIFJlY2VpdmVkIFtcIiArIHNsaWNlLmNhbGwoYXJncykuam9pbihcIiwgXCIpICsgXCJdXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgfVxuXG4gICAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuXG4gICAgdmFyIGNhbGxQcm90byA9IHtcbiAgICAgICAgY2FsbGVkT246IGZ1bmN0aW9uIGNhbGxlZE9uKHRoaXNWYWx1ZSkge1xuICAgICAgICAgICAgaWYgKHNpbm9uLm1hdGNoICYmIHNpbm9uLm1hdGNoLmlzTWF0Y2hlcih0aGlzVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNWYWx1ZS50ZXN0KHRoaXMudGhpc1ZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRoaXNWYWx1ZSA9PT0gdGhpc1ZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGxlZFdpdGg6IGZ1bmN0aW9uIGNhbGxlZFdpdGgoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNpbm9uLmRlZXBFcXVhbChhcmd1bWVudHNbaV0sIHRoaXMuYXJnc1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGVkV2l0aE1hdGNoOiBmdW5jdGlvbiBjYWxsZWRXaXRoTWF0Y2goKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgYWN0dWFsID0gdGhpcy5hcmdzW2ldO1xuICAgICAgICAgICAgICAgIHZhciBleHBlY3RhdGlvbiA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgICAgICBpZiAoIXNpbm9uLm1hdGNoIHx8ICFzaW5vbi5tYXRjaChleHBlY3RhdGlvbikudGVzdChhY3R1YWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsZWRXaXRoRXhhY3RseTogZnVuY3Rpb24gY2FsbGVkV2l0aEV4YWN0bHkoKSB7XG4gICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PSB0aGlzLmFyZ3MubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsZWRXaXRoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbm90Q2FsbGVkV2l0aDogZnVuY3Rpb24gbm90Q2FsbGVkV2l0aCgpIHtcbiAgICAgICAgICAgIHJldHVybiAhdGhpcy5jYWxsZWRXaXRoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbm90Q2FsbGVkV2l0aE1hdGNoOiBmdW5jdGlvbiBub3RDYWxsZWRXaXRoTWF0Y2goKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuY2FsbGVkV2l0aE1hdGNoLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmV0dXJuZWQ6IGZ1bmN0aW9uIHJldHVybmVkKHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2lub24uZGVlcEVxdWFsKHZhbHVlLCB0aGlzLnJldHVyblZhbHVlKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0aHJldzogZnVuY3Rpb24gdGhyZXcoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXJyb3IgPT09IFwidW5kZWZpbmVkXCIgfHwgIXRoaXMuZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICEhdGhpcy5leGNlcHRpb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV4Y2VwdGlvbiA9PT0gZXJyb3IgfHwgdGhpcy5leGNlcHRpb24ubmFtZSA9PT0gZXJyb3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGVkV2l0aE5ldzogZnVuY3Rpb24gY2FsbGVkV2l0aE5ldygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByb3h5LnByb3RvdHlwZSAmJiB0aGlzLnRoaXNWYWx1ZSBpbnN0YW5jZW9mIHRoaXMucHJveHk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGVkQmVmb3JlOiBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhbGxJZCA8IG90aGVyLmNhbGxJZDtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsZWRBZnRlcjogZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWxsSWQgPiBvdGhlci5jYWxsSWQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbEFyZzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgICAgICAgdGhpcy5hcmdzW3Bvc10oKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsQXJnT246IGZ1bmN0aW9uIChwb3MsIHRoaXNWYWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5hcmdzW3Bvc10uYXBwbHkodGhpc1ZhbHVlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsQXJnV2l0aDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnT25XaXRoLmFwcGx5KHRoaXMsIFtwb3MsIG51bGxdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsQXJnT25XaXRoOiBmdW5jdGlvbiAocG9zLCB0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgICAgICAgICAgdGhpcy5hcmdzW3Bvc10uYXBwbHkodGhpc1ZhbHVlLCBhcmdzKTtcbiAgICAgICAgfSxcblxuICAgICAgICBcInlpZWxkXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMueWllbGRPbi5hcHBseSh0aGlzLCBbbnVsbF0uY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHlpZWxkT246IGZ1bmN0aW9uICh0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gdGhpcy5hcmdzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmdzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXJnc1tpXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbaV0uYXBwbHkodGhpc1ZhbHVlLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3dZaWVsZEVycm9yKHRoaXMucHJveHksIFwiIGNhbm5vdCB5aWVsZCBzaW5jZSBubyBjYWxsYmFjayB3YXMgcGFzc2VkLlwiLCBhcmdzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB5aWVsZFRvOiBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgICAgICAgdGhpcy55aWVsZFRvT24uYXBwbHkodGhpcywgW3Byb3AsIG51bGxdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpKTtcbiAgICAgICAgfSxcblxuICAgICAgICB5aWVsZFRvT246IGZ1bmN0aW9uIChwcm9wLCB0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gdGhpcy5hcmdzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmdzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzW2ldICYmIHR5cGVvZiBhcmdzW2ldW3Byb3BdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJnc1tpXVtwcm9wXS5hcHBseSh0aGlzVmFsdWUsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvd1lpZWxkRXJyb3IodGhpcy5wcm94eSwgXCIgY2Fubm90IHlpZWxkIHRvICdcIiArIHByb3AgK1xuICAgICAgICAgICAgICAgIFwiJyBzaW5jZSBubyBjYWxsYmFjayB3YXMgcGFzc2VkLlwiLCBhcmdzKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNhbGxTdHIgPSB0aGlzLnByb3h5LnRvU3RyaW5nKCkgKyBcIihcIjtcbiAgICAgICAgICAgIHZhciBhcmdzID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5hcmdzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChzaW5vbi5mb3JtYXQodGhpcy5hcmdzW2ldKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxTdHIgPSBjYWxsU3RyICsgYXJncy5qb2luKFwiLCBcIikgKyBcIilcIjtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnJldHVyblZhbHVlICE9IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBjYWxsU3RyICs9IFwiID0+IFwiICsgc2lub24uZm9ybWF0KHRoaXMucmV0dXJuVmFsdWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5leGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICBjYWxsU3RyICs9IFwiICFcIiArIHRoaXMuZXhjZXB0aW9uLm5hbWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5leGNlcHRpb24ubWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsU3RyICs9IFwiKFwiICsgdGhpcy5leGNlcHRpb24ubWVzc2FnZSArIFwiKVwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGNhbGxTdHI7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgY2FsbFByb3RvLmludm9rZUNhbGxiYWNrID0gY2FsbFByb3RvLnlpZWxkO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlU3B5Q2FsbChzcHksIHRoaXNWYWx1ZSwgYXJncywgcmV0dXJuVmFsdWUsIGV4Y2VwdGlvbiwgaWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBpZCAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbGwgaWQgaXMgbm90IGEgbnVtYmVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcm94eUNhbGwgPSBzaW5vbi5jcmVhdGUoY2FsbFByb3RvKTtcbiAgICAgICAgcHJveHlDYWxsLnByb3h5ID0gc3B5O1xuICAgICAgICBwcm94eUNhbGwudGhpc1ZhbHVlID0gdGhpc1ZhbHVlO1xuICAgICAgICBwcm94eUNhbGwuYXJncyA9IGFyZ3M7XG4gICAgICAgIHByb3h5Q2FsbC5yZXR1cm5WYWx1ZSA9IHJldHVyblZhbHVlO1xuICAgICAgICBwcm94eUNhbGwuZXhjZXB0aW9uID0gZXhjZXB0aW9uO1xuICAgICAgICBwcm94eUNhbGwuY2FsbElkID0gaWQ7XG5cbiAgICAgICAgcmV0dXJuIHByb3h5Q2FsbDtcbiAgICB9XG4gICAgY3JlYXRlU3B5Q2FsbC50b1N0cmluZyA9IGNhbGxQcm90by50b1N0cmluZzsgLy8gdXNlZCBieSBtb2Nrc1xuXG4gICAgaWYgKGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gY3JlYXRlU3B5Q2FsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi5zcHlDYWxsID0gY3JlYXRlU3B5Q2FsbDtcbiAgICB9XG59KHR5cGVvZiBzaW5vbiA9PSBcIm9iamVjdFwiICYmIHNpbm9uIHx8IG51bGwpKTtcblxuIiwiLyoqXG4gKiBAZGVwZW5kIC4uL3Npbm9uLmpzXG4gKiBAZGVwZW5kIHN0dWIuanNcbiAqIEBkZXBlbmQgbW9jay5qc1xuICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlLCBmb3JpbjogdHJ1ZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICogQ29sbGVjdGlvbnMgb2Ygc3R1YnMsIHNwaWVzIGFuZCBtb2Nrcy5cbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuKGZ1bmN0aW9uIChzaW5vbikge1xuICAgIHZhciBjb21tb25KU01vZHVsZSA9IHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzO1xuICAgIHZhciBwdXNoID0gW10ucHVzaDtcbiAgICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4gICAgaWYgKCFzaW5vbiAmJiBjb21tb25KU01vZHVsZSkge1xuICAgICAgICBzaW5vbiA9IHJlcXVpcmUoXCIuLi9zaW5vblwiKTtcbiAgICB9XG5cbiAgICBpZiAoIXNpbm9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRGYWtlcyhmYWtlQ29sbGVjdGlvbikge1xuICAgICAgICBpZiAoIWZha2VDb2xsZWN0aW9uLmZha2VzKSB7XG4gICAgICAgICAgICBmYWtlQ29sbGVjdGlvbi5mYWtlcyA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZha2VDb2xsZWN0aW9uLmZha2VzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVhY2goZmFrZUNvbGxlY3Rpb24sIG1ldGhvZCkge1xuICAgICAgICB2YXIgZmFrZXMgPSBnZXRGYWtlcyhmYWtlQ29sbGVjdGlvbik7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmYWtlcy5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZmFrZXNbaV1bbWV0aG9kXSA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBmYWtlc1tpXVttZXRob2RdKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb21wYWN0KGZha2VDb2xsZWN0aW9uKSB7XG4gICAgICAgIHZhciBmYWtlcyA9IGdldEZha2VzKGZha2VDb2xsZWN0aW9uKTtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IGZha2VzLmxlbmd0aCkge1xuICAgICAgICAgIGZha2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjb2xsZWN0aW9uID0ge1xuICAgICAgICB2ZXJpZnk6IGZ1bmN0aW9uIHJlc29sdmUoKSB7XG4gICAgICAgICAgICBlYWNoKHRoaXMsIFwidmVyaWZ5XCIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlc3RvcmU6IGZ1bmN0aW9uIHJlc3RvcmUoKSB7XG4gICAgICAgICAgICBlYWNoKHRoaXMsIFwicmVzdG9yZVwiKTtcbiAgICAgICAgICAgIGNvbXBhY3QodGhpcyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdmVyaWZ5QW5kUmVzdG9yZTogZnVuY3Rpb24gdmVyaWZ5QW5kUmVzdG9yZSgpIHtcbiAgICAgICAgICAgIHZhciBleGNlcHRpb247XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnkoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBleGNlcHRpb24gPSBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJlc3RvcmUoKTtcblxuICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhZGQ6IGZ1bmN0aW9uIGFkZChmYWtlKSB7XG4gICAgICAgICAgICBwdXNoLmNhbGwoZ2V0RmFrZXModGhpcyksIGZha2UpO1xuICAgICAgICAgICAgcmV0dXJuIGZha2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3B5OiBmdW5jdGlvbiBzcHkoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoc2lub24uc3B5LmFwcGx5KHNpbm9uLCBhcmd1bWVudHMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdHViOiBmdW5jdGlvbiBzdHViKG9iamVjdCwgcHJvcGVydHksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAocHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3JpZ2luYWwgPSBvYmplY3RbcHJvcGVydHldO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcmlnaW5hbCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IHN0dWIgbm9uLWV4aXN0ZW50IG93biBwcm9wZXJ0eSBcIiArIHByb3BlcnR5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFtwcm9wZXJ0eV0gPSB2YWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdG9yZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFtwcm9wZXJ0eV0gPSBvcmlnaW5hbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFwcm9wZXJ0eSAmJiAhIW9iamVjdCAmJiB0eXBlb2Ygb2JqZWN0ID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3R1YmJlZE9iaiA9IHNpbm9uLnN0dWIuYXBwbHkoc2lub24sIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHN0dWJiZWRPYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHViYmVkT2JqW3Byb3BdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkKHN0dWJiZWRPYmpbcHJvcF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0dWJiZWRPYmo7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZChzaW5vbi5zdHViLmFwcGx5KHNpbm9uLCBhcmd1bWVudHMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBtb2NrOiBmdW5jdGlvbiBtb2NrKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHNpbm9uLm1vY2suYXBwbHkoc2lub24sIGFyZ3VtZW50cykpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluamVjdDogZnVuY3Rpb24gaW5qZWN0KG9iaikge1xuICAgICAgICAgICAgdmFyIGNvbCA9IHRoaXM7XG5cbiAgICAgICAgICAgIG9iai5zcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbC5zcHkuYXBwbHkoY29sLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgb2JqLnN0dWIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbC5zdHViLmFwcGx5KGNvbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG9iai5tb2NrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2wubW9jay5hcHBseShjb2wsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGNvbGxlY3Rpb247XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2lub24uY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsKSk7XG4iLCIvKiBAZGVwZW5kIC4uL3Npbm9uLmpzICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlLCBwbHVzcGx1czogZmFsc2UqL1xuLypnbG9iYWwgbW9kdWxlLCByZXF1aXJlLCBzaW5vbiovXG4vKipcbiAqIE1hdGNoIGZ1bmN0aW9uc1xuICpcbiAqIEBhdXRob3IgTWF4aW1pbGlhbiBBbnRvbmkgKG1haWxAbWF4YW50b25pLmRlKVxuICogQGxpY2Vuc2UgQlNEXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEyIE1heGltaWxpYW4gQW50b25pXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG4oZnVuY3Rpb24gKHNpbm9uKSB7XG4gICAgdmFyIGNvbW1vbkpTTW9kdWxlID0gdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHM7XG5cbiAgICBpZiAoIXNpbm9uICYmIGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIHNpbm9uID0gcmVxdWlyZShcIi4uL3Npbm9uXCIpO1xuICAgIH1cblxuICAgIGlmICghc2lub24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzc2VydFR5cGUodmFsdWUsIHR5cGUsIG5hbWUpIHtcbiAgICAgICAgdmFyIGFjdHVhbCA9IHNpbm9uLnR5cGVPZih2YWx1ZSk7XG4gICAgICAgIGlmIChhY3R1YWwgIT09IHR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJFeHBlY3RlZCB0eXBlIG9mIFwiICsgbmFtZSArIFwiIHRvIGJlIFwiICtcbiAgICAgICAgICAgICAgICB0eXBlICsgXCIsIGJ1dCB3YXMgXCIgKyBhY3R1YWwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG1hdGNoZXIgPSB7XG4gICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tZXNzYWdlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGlzTWF0Y2hlcihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoZXIuaXNQcm90b3R5cGVPZihvYmplY3QpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoT2JqZWN0KGV4cGVjdGF0aW9uLCBhY3R1YWwpIHtcbiAgICAgICAgaWYgKGFjdHVhbCA9PT0gbnVsbCB8fCBhY3R1YWwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBleHBlY3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKGV4cGVjdGF0aW9uLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXhwID0gZXhwZWN0YXRpb25ba2V5XTtcbiAgICAgICAgICAgICAgICB2YXIgYWN0ID0gYWN0dWFsW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoLmlzTWF0Y2hlcihleHApKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhwLnRlc3QoYWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzaW5vbi50eXBlT2YoZXhwKSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoT2JqZWN0KGV4cCwgYWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghc2lub24uZGVlcEVxdWFsKGV4cCwgYWN0KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIG1hdGNoZXIub3IgPSBmdW5jdGlvbiAobTIpIHtcbiAgICAgICAgaWYgKCFpc01hdGNoZXIobTIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTWF0Y2hlciBleHBlY3RlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbTEgPSB0aGlzO1xuICAgICAgICB2YXIgb3IgPSBzaW5vbi5jcmVhdGUobWF0Y2hlcik7XG4gICAgICAgIG9yLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gbTEudGVzdChhY3R1YWwpIHx8IG0yLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgfTtcbiAgICAgICAgb3IubWVzc2FnZSA9IG0xLm1lc3NhZ2UgKyBcIi5vcihcIiArIG0yLm1lc3NhZ2UgKyBcIilcIjtcbiAgICAgICAgcmV0dXJuIG9yO1xuICAgIH07XG5cbiAgICBtYXRjaGVyLmFuZCA9IGZ1bmN0aW9uIChtMikge1xuICAgICAgICBpZiAoIWlzTWF0Y2hlcihtMikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJNYXRjaGVyIGV4cGVjdGVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtMSA9IHRoaXM7XG4gICAgICAgIHZhciBhbmQgPSBzaW5vbi5jcmVhdGUobWF0Y2hlcik7XG4gICAgICAgIGFuZC50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIG0xLnRlc3QoYWN0dWFsKSAmJiBtMi50ZXN0KGFjdHVhbCk7XG4gICAgICAgIH07XG4gICAgICAgIGFuZC5tZXNzYWdlID0gbTEubWVzc2FnZSArIFwiLmFuZChcIiArIG0yLm1lc3NhZ2UgKyBcIilcIjtcbiAgICAgICAgcmV0dXJuIGFuZDtcbiAgICB9O1xuXG4gICAgdmFyIG1hdGNoID0gZnVuY3Rpb24gKGV4cGVjdGF0aW9uLCBtZXNzYWdlKSB7XG4gICAgICAgIHZhciBtID0gc2lub24uY3JlYXRlKG1hdGNoZXIpO1xuICAgICAgICB2YXIgdHlwZSA9IHNpbm9uLnR5cGVPZihleHBlY3RhdGlvbik7XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cGVjdGF0aW9uLnRlc3QgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIG0udGVzdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4cGVjdGF0aW9uLnRlc3QoYWN0dWFsKSA9PT0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG0ubWVzc2FnZSA9IFwibWF0Y2goXCIgKyBzaW5vbi5mdW5jdGlvbk5hbWUoZXhwZWN0YXRpb24udGVzdCkgKyBcIilcIjtcbiAgICAgICAgICAgICAgICByZXR1cm4gbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzdHIgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBleHBlY3RhdGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChleHBlY3RhdGlvbi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ci5wdXNoKGtleSArIFwiOiBcIiArIGV4cGVjdGF0aW9uW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG0udGVzdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hPYmplY3QoZXhwZWN0YXRpb24sIGFjdHVhbCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbS5tZXNzYWdlID0gXCJtYXRjaChcIiArIHN0ci5qb2luKFwiLCBcIikgKyBcIilcIjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICBtLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cGVjdGF0aW9uID09IGFjdHVhbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgbS50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjdHVhbC5pbmRleE9mKGV4cGVjdGF0aW9uKSAhPT0gLTE7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbS5tZXNzYWdlID0gXCJtYXRjaChcXFwiXCIgKyBleHBlY3RhdGlvbiArIFwiXFxcIilcIjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicmVnZXhwXCI6XG4gICAgICAgICAgICBtLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhY3R1YWwgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwZWN0YXRpb24udGVzdChhY3R1YWwpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgICAgIG0udGVzdCA9IGV4cGVjdGF0aW9uO1xuICAgICAgICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBtLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtLm1lc3NhZ2UgPSBcIm1hdGNoKFwiICsgc2lub24uZnVuY3Rpb25OYW1lKGV4cGVjdGF0aW9uKSArIFwiKVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBtLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzaW5vbi5kZWVwRXF1YWwoZXhwZWN0YXRpb24sIGFjdHVhbCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICghbS5tZXNzYWdlKSB7XG4gICAgICAgICAgICBtLm1lc3NhZ2UgPSBcIm1hdGNoKFwiICsgZXhwZWN0YXRpb24gKyBcIilcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbTtcbiAgICB9O1xuXG4gICAgbWF0Y2guaXNNYXRjaGVyID0gaXNNYXRjaGVyO1xuXG4gICAgbWF0Y2guYW55ID0gbWF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LCBcImFueVwiKTtcblxuICAgIG1hdGNoLmRlZmluZWQgPSBtYXRjaChmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgIHJldHVybiBhY3R1YWwgIT09IG51bGwgJiYgYWN0dWFsICE9PSB1bmRlZmluZWQ7XG4gICAgfSwgXCJkZWZpbmVkXCIpO1xuXG4gICAgbWF0Y2gudHJ1dGh5ID0gbWF0Y2goZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICByZXR1cm4gISFhY3R1YWw7XG4gICAgfSwgXCJ0cnV0aHlcIik7XG5cbiAgICBtYXRjaC5mYWxzeSA9IG1hdGNoKGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgcmV0dXJuICFhY3R1YWw7XG4gICAgfSwgXCJmYWxzeVwiKTtcblxuICAgIG1hdGNoLnNhbWUgPSBmdW5jdGlvbiAoZXhwZWN0YXRpb24pIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoKGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgICAgIHJldHVybiBleHBlY3RhdGlvbiA9PT0gYWN0dWFsO1xuICAgICAgICB9LCBcInNhbWUoXCIgKyBleHBlY3RhdGlvbiArIFwiKVwiKTtcbiAgICB9O1xuXG4gICAgbWF0Y2gudHlwZU9mID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgYXNzZXJ0VHlwZSh0eXBlLCBcInN0cmluZ1wiLCBcInR5cGVcIik7XG4gICAgICAgIHJldHVybiBtYXRjaChmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gc2lub24udHlwZU9mKGFjdHVhbCkgPT09IHR5cGU7XG4gICAgICAgIH0sIFwidHlwZU9mKFxcXCJcIiArIHR5cGUgKyBcIlxcXCIpXCIpO1xuICAgIH07XG5cbiAgICBtYXRjaC5pbnN0YW5jZU9mID0gZnVuY3Rpb24gKHR5cGUpIHtcbiAgICAgICAgYXNzZXJ0VHlwZSh0eXBlLCBcImZ1bmN0aW9uXCIsIFwidHlwZVwiKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoKGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgICAgIHJldHVybiBhY3R1YWwgaW5zdGFuY2VvZiB0eXBlO1xuICAgICAgICB9LCBcImluc3RhbmNlT2YoXCIgKyBzaW5vbi5mdW5jdGlvbk5hbWUodHlwZSkgKyBcIilcIik7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVByb3BlcnR5TWF0Y2hlcihwcm9wZXJ0eVRlc3QsIG1lc3NhZ2VQcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICAgICAgICAgIGFzc2VydFR5cGUocHJvcGVydHksIFwic3RyaW5nXCIsIFwicHJvcGVydHlcIik7XG4gICAgICAgICAgICB2YXIgb25seVByb3BlcnR5ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMTtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gbWVzc2FnZVByZWZpeCArIFwiKFxcXCJcIiArIHByb3BlcnR5ICsgXCJcXFwiXCI7XG4gICAgICAgICAgICBpZiAoIW9ubHlQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gXCIsIFwiICsgdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXNzYWdlICs9IFwiKVwiO1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoKGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWN0dWFsID09PSB1bmRlZmluZWQgfHwgYWN0dWFsID09PSBudWxsIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAhcHJvcGVydHlUZXN0KGFjdHVhbCwgcHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9ubHlQcm9wZXJ0eSB8fCBzaW5vbi5kZWVwRXF1YWwodmFsdWUsIGFjdHVhbFtwcm9wZXJ0eV0pO1xuICAgICAgICAgICAgfSwgbWVzc2FnZSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgbWF0Y2guaGFzID0gY3JlYXRlUHJvcGVydHlNYXRjaGVyKGZ1bmN0aW9uIChhY3R1YWwsIHByb3BlcnR5KSB7XG4gICAgICAgIGlmICh0eXBlb2YgYWN0dWFsID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHkgaW4gYWN0dWFsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhY3R1YWxbcHJvcGVydHldICE9PSB1bmRlZmluZWQ7XG4gICAgfSwgXCJoYXNcIik7XG5cbiAgICBtYXRjaC5oYXNPd24gPSBjcmVhdGVQcm9wZXJ0eU1hdGNoZXIoZnVuY3Rpb24gKGFjdHVhbCwgcHJvcGVydHkpIHtcbiAgICAgICAgcmV0dXJuIGFjdHVhbC5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSk7XG4gICAgfSwgXCJoYXNPd25cIik7XG5cbiAgICBtYXRjaC5ib29sID0gbWF0Y2gudHlwZU9mKFwiYm9vbGVhblwiKTtcbiAgICBtYXRjaC5udW1iZXIgPSBtYXRjaC50eXBlT2YoXCJudW1iZXJcIik7XG4gICAgbWF0Y2guc3RyaW5nID0gbWF0Y2gudHlwZU9mKFwic3RyaW5nXCIpO1xuICAgIG1hdGNoLm9iamVjdCA9IG1hdGNoLnR5cGVPZihcIm9iamVjdFwiKTtcbiAgICBtYXRjaC5mdW5jID0gbWF0Y2gudHlwZU9mKFwiZnVuY3Rpb25cIik7XG4gICAgbWF0Y2guYXJyYXkgPSBtYXRjaC50eXBlT2YoXCJhcnJheVwiKTtcbiAgICBtYXRjaC5yZWdleHAgPSBtYXRjaC50eXBlT2YoXCJyZWdleHBcIik7XG4gICAgbWF0Y2guZGF0ZSA9IG1hdGNoLnR5cGVPZihcImRhdGVcIik7XG5cbiAgICBpZiAoY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtYXRjaDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi5tYXRjaCA9IG1hdGNoO1xuICAgIH1cbn0odHlwZW9mIHNpbm9uID09IFwib2JqZWN0XCIgJiYgc2lub24gfHwgbnVsbCkpO1xuIiwiLyoqXG4gKiBAZGVwZW5kIC4uL3Npbm9uLmpzXG4gKiBAZGVwZW5kIHN0dWIuanNcbiAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgbm9tZW46IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24qL1xuLyoqXG4gKiBNb2NrIGZ1bmN0aW9ucy5cbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuKGZ1bmN0aW9uIChzaW5vbikge1xuICAgIHZhciBjb21tb25KU01vZHVsZSA9IHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzO1xuICAgIHZhciBwdXNoID0gW10ucHVzaDtcbiAgICB2YXIgbWF0Y2g7XG5cbiAgICBpZiAoIXNpbm9uICYmIGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIHNpbm9uID0gcmVxdWlyZShcIi4uL3Npbm9uXCIpO1xuICAgIH1cblxuICAgIGlmICghc2lub24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG1hdGNoID0gc2lub24ubWF0Y2g7XG5cbiAgICBpZiAoIW1hdGNoICYmIGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIG1hdGNoID0gcmVxdWlyZShcIi4vbWF0Y2hcIik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbW9jayhvYmplY3QpIHtcbiAgICAgICAgaWYgKCFvYmplY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBzaW5vbi5leHBlY3RhdGlvbi5jcmVhdGUoXCJBbm9ueW1vdXMgbW9ja1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtb2NrLmNyZWF0ZShvYmplY3QpO1xuICAgIH1cblxuICAgIHNpbm9uLm1vY2sgPSBtb2NrO1xuXG4gICAgc2lub24uZXh0ZW5kKG1vY2ssIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZ1bmN0aW9uIGVhY2goY29sbGVjdGlvbiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICghY29sbGVjdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjb2xsZWN0aW9uLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGNvbGxlY3Rpb25baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKG9iamVjdCkge1xuICAgICAgICAgICAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJvYmplY3QgaXMgbnVsbFwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbW9ja09iamVjdCA9IHNpbm9uLmV4dGVuZCh7fSwgbW9jayk7XG4gICAgICAgICAgICAgICAgbW9ja09iamVjdC5vYmplY3QgPSBvYmplY3Q7XG4gICAgICAgICAgICAgICAgZGVsZXRlIG1vY2tPYmplY3QuY3JlYXRlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tPYmplY3Q7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBleHBlY3RzOiBmdW5jdGlvbiBleHBlY3RzKG1ldGhvZCkge1xuICAgICAgICAgICAgICAgIGlmICghbWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJtZXRob2QgaXMgZmFsc3lcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmV4cGVjdGF0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGVjdGF0aW9ucyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb3hpZXMgPSBbXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZXhwZWN0YXRpb25zW21ldGhvZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBlY3RhdGlvbnNbbWV0aG9kXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbW9ja09iamVjdCA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICAgICAgc2lub24ud3JhcE1ldGhvZCh0aGlzLm9iamVjdCwgbWV0aG9kLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbW9ja09iamVjdC5pbnZva2VNZXRob2QobWV0aG9kLCB0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwodGhpcy5wcm94aWVzLCBtZXRob2QpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBleHBlY3RhdGlvbiA9IHNpbm9uLmV4cGVjdGF0aW9uLmNyZWF0ZShtZXRob2QpO1xuICAgICAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLmV4cGVjdGF0aW9uc1ttZXRob2RdLCBleHBlY3RhdGlvbik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwZWN0YXRpb247XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlKCkge1xuICAgICAgICAgICAgICAgIHZhciBvYmplY3QgPSB0aGlzLm9iamVjdDtcblxuICAgICAgICAgICAgICAgIGVhY2godGhpcy5wcm94aWVzLCBmdW5jdGlvbiAocHJveHkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3RbcHJveHldLnJlc3RvcmUgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbcHJveHldLnJlc3RvcmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdmVyaWZ5OiBmdW5jdGlvbiB2ZXJpZnkoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGVjdGF0aW9ucyA9IHRoaXMuZXhwZWN0YXRpb25zIHx8IHt9O1xuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlcyA9IFtdLCBtZXQgPSBbXTtcblxuICAgICAgICAgICAgICAgIGVhY2godGhpcy5wcm94aWVzLCBmdW5jdGlvbiAocHJveHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZWFjaChleHBlY3RhdGlvbnNbcHJveHldLCBmdW5jdGlvbiAoZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXhwZWN0YXRpb24ubWV0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwobWVzc2FnZXMsIGV4cGVjdGF0aW9uLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwobWV0LCBleHBlY3RhdGlvbi50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlc3RvcmUoKTtcblxuICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbm9uLmV4cGVjdGF0aW9uLmZhaWwobWVzc2FnZXMuY29uY2F0KG1ldCkuam9pbihcIlxcblwiKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24ucGFzcyhtZXNzYWdlcy5jb25jYXQobWV0KS5qb2luKFwiXFxuXCIpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGludm9rZU1ldGhvZDogZnVuY3Rpb24gaW52b2tlTWV0aG9kKG1ldGhvZCwgdGhpc1ZhbHVlLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGVjdGF0aW9ucyA9IHRoaXMuZXhwZWN0YXRpb25zICYmIHRoaXMuZXhwZWN0YXRpb25zW21ldGhvZF07XG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGV4cGVjdGF0aW9ucyAmJiBleHBlY3RhdGlvbnMubGVuZ3RoIHx8IDAsIGk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFleHBlY3RhdGlvbnNbaV0ubWV0KCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cGVjdGF0aW9uc1tpXS5hbGxvd3NDYWxsKHRoaXNWYWx1ZSwgYXJncykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBlY3RhdGlvbnNbaV0uYXBwbHkodGhpc1ZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlcyA9IFtdLCBhdmFpbGFibGUsIGV4aGF1c3RlZCA9IDA7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGVjdGF0aW9uc1tpXS5hbGxvd3NDYWxsKHRoaXNWYWx1ZSwgYXJncykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZSA9IGF2YWlsYWJsZSB8fCBleHBlY3RhdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBleGhhdXN0ZWQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwobWVzc2FnZXMsIFwiICAgIFwiICsgZXhwZWN0YXRpb25zW2ldLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChleGhhdXN0ZWQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF2YWlsYWJsZS5hcHBseSh0aGlzVmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG1lc3NhZ2VzLnVuc2hpZnQoXCJVbmV4cGVjdGVkIGNhbGw6IFwiICsgc2lub24uc3B5Q2FsbC50b1N0cmluZy5jYWxsKHtcbiAgICAgICAgICAgICAgICAgICAgcHJveHk6IG1ldGhvZCxcbiAgICAgICAgICAgICAgICAgICAgYXJnczogYXJnc1xuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIHNpbm9uLmV4cGVjdGF0aW9uLmZhaWwobWVzc2FnZXMuam9pbihcIlxcblwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSgpKSk7XG5cbiAgICB2YXIgdGltZXMgPSBzaW5vbi50aW1lc0luV29yZHM7XG5cbiAgICBzaW5vbi5leHBlY3RhdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbiAgICAgICAgdmFyIF9pbnZva2UgPSBzaW5vbi5zcHkuaW52b2tlO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNhbGxDb3VudEluV29yZHMoY2FsbENvdW50KSB7XG4gICAgICAgICAgICBpZiAoY2FsbENvdW50ID09IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJuZXZlciBjYWxsZWRcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiY2FsbGVkIFwiICsgdGltZXMoY2FsbENvdW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGV4cGVjdGVkQ2FsbENvdW50SW5Xb3JkcyhleHBlY3RhdGlvbikge1xuICAgICAgICAgICAgdmFyIG1pbiA9IGV4cGVjdGF0aW9uLm1pbkNhbGxzO1xuICAgICAgICAgICAgdmFyIG1heCA9IGV4cGVjdGF0aW9uLm1heENhbGxzO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1pbiA9PSBcIm51bWJlclwiICYmIHR5cGVvZiBtYXggPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHZhciBzdHIgPSB0aW1lcyhtaW4pO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1pbiAhPSBtYXgpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyID0gXCJhdCBsZWFzdCBcIiArIHN0ciArIFwiIGFuZCBhdCBtb3N0IFwiICsgdGltZXMobWF4KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1pbiA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiYXQgbGVhc3QgXCIgKyB0aW1lcyhtaW4pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gXCJhdCBtb3N0IFwiICsgdGltZXMobWF4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHJlY2VpdmVkTWluQ2FsbHMoZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBoYXNNaW5MaW1pdCA9IHR5cGVvZiBleHBlY3RhdGlvbi5taW5DYWxscyA9PSBcIm51bWJlclwiO1xuICAgICAgICAgICAgcmV0dXJuICFoYXNNaW5MaW1pdCB8fCBleHBlY3RhdGlvbi5jYWxsQ291bnQgPj0gZXhwZWN0YXRpb24ubWluQ2FsbHM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZWNlaXZlZE1heENhbGxzKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGV4cGVjdGF0aW9uLm1heENhbGxzICE9IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBleHBlY3RhdGlvbi5jYWxsQ291bnQgPT0gZXhwZWN0YXRpb24ubWF4Q2FsbHM7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB2ZXJpZnlNYXRjaGVyKHBvc3NpYmxlTWF0Y2hlciwgYXJnKXtcbiAgICAgICAgICAgIGlmIChtYXRjaCAmJiBtYXRjaC5pc01hdGNoZXIocG9zc2libGVNYXRjaGVyKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3NzaWJsZU1hdGNoZXIudGVzdChhcmcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtaW5DYWxsczogMSxcbiAgICAgICAgICAgIG1heENhbGxzOiAxLFxuXG4gICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShtZXRob2ROYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cGVjdGF0aW9uID0gc2lub24uZXh0ZW5kKHNpbm9uLnN0dWIuY3JlYXRlKCksIHNpbm9uLmV4cGVjdGF0aW9uKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZXhwZWN0YXRpb24uY3JlYXRlO1xuICAgICAgICAgICAgICAgIGV4cGVjdGF0aW9uLm1ldGhvZCA9IG1ldGhvZE5hbWU7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwZWN0YXRpb247XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpbnZva2U6IGZ1bmN0aW9uIGludm9rZShmdW5jLCB0aGlzVmFsdWUsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeUNhbGxBbGxvd2VkKHRoaXNWYWx1ZSwgYXJncyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gX2ludm9rZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXRMZWFzdDogZnVuY3Rpb24gYXRMZWFzdChudW0pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG51bSAhPSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCInXCIgKyBudW0gKyBcIicgaXMgbm90IG51bWJlclwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMubGltaXRzU2V0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWF4Q2FsbHMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbWl0c1NldCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5taW5DYWxscyA9IG51bTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXRNb3N0OiBmdW5jdGlvbiBhdE1vc3QobnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBudW0gIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiJ1wiICsgbnVtICsgXCInIGlzIG5vdCBudW1iZXJcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxpbWl0c1NldCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1pbkNhbGxzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW1pdHNTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMubWF4Q2FsbHMgPSBudW07XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG5ldmVyOiBmdW5jdGlvbiBuZXZlcigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGFjdGx5KDApO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25jZTogZnVuY3Rpb24gb25jZSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGFjdGx5KDEpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdHdpY2U6IGZ1bmN0aW9uIHR3aWNlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmV4YWN0bHkoMik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB0aHJpY2U6IGZ1bmN0aW9uIHRocmljZSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGFjdGx5KDMpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZXhhY3RseTogZnVuY3Rpb24gZXhhY3RseShudW0pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG51bSAhPSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCInXCIgKyBudW0gKyBcIicgaXMgbm90IGEgbnVtYmVyXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuYXRMZWFzdChudW0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmF0TW9zdChudW0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgbWV0OiBmdW5jdGlvbiBtZXQoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICF0aGlzLmZhaWxlZCAmJiByZWNlaXZlZE1pbkNhbGxzKHRoaXMpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdmVyaWZ5Q2FsbEFsbG93ZWQ6IGZ1bmN0aW9uIHZlcmlmeUNhbGxBbGxvd2VkKHRoaXNWYWx1ZSwgYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChyZWNlaXZlZE1heENhbGxzKHRoaXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24uZmFpbCh0aGlzLm1ldGhvZCArIFwiIGFscmVhZHkgY2FsbGVkIFwiICsgdGltZXModGhpcy5tYXhDYWxscykpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChcImV4cGVjdGVkVGhpc1wiIGluIHRoaXMgJiYgdGhpcy5leHBlY3RlZFRoaXMgIT09IHRoaXNWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKHRoaXMubWV0aG9kICsgXCIgY2FsbGVkIHdpdGggXCIgKyB0aGlzVmFsdWUgKyBcIiBhcyB0aGlzVmFsdWUsIGV4cGVjdGVkIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWRUaGlzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIShcImV4cGVjdGVkQXJndW1lbnRzXCIgaW4gdGhpcykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghYXJncykge1xuICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKHRoaXMubWV0aG9kICsgXCIgcmVjZWl2ZWQgbm8gYXJndW1lbnRzLCBleHBlY3RlZCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBzaW5vbi5mb3JtYXQodGhpcy5leHBlY3RlZEFyZ3VtZW50cykpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbm9uLmV4cGVjdGF0aW9uLmZhaWwodGhpcy5tZXRob2QgKyBcIiByZWNlaXZlZCB0b28gZmV3IGFyZ3VtZW50cyAoXCIgKyBzaW5vbi5mb3JtYXQoYXJncykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIpLCBleHBlY3RlZCBcIiArIHNpbm9uLmZvcm1hdCh0aGlzLmV4cGVjdGVkQXJndW1lbnRzKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZXhwZWN0c0V4YWN0QXJnQ291bnQgJiZcbiAgICAgICAgICAgICAgICAgICAgYXJncy5sZW5ndGggIT0gdGhpcy5leHBlY3RlZEFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24uZmFpbCh0aGlzLm1ldGhvZCArIFwiIHJlY2VpdmVkIHRvbyBtYW55IGFyZ3VtZW50cyAoXCIgKyBzaW5vbi5mb3JtYXQoYXJncykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCIpLCBleHBlY3RlZCBcIiArIHNpbm9uLmZvcm1hdCh0aGlzLmV4cGVjdGVkQXJndW1lbnRzKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmV4cGVjdGVkQXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghdmVyaWZ5TWF0Y2hlcih0aGlzLmV4cGVjdGVkQXJndW1lbnRzW2ldLGFyZ3NbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKHRoaXMubWV0aG9kICsgXCIgcmVjZWl2ZWQgd3JvbmcgYXJndW1lbnRzIFwiICsgc2lub24uZm9ybWF0KGFyZ3MpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiwgZGlkbid0IG1hdGNoIFwiICsgdGhpcy5leHBlY3RlZEFyZ3VtZW50cy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2lub24uZGVlcEVxdWFsKHRoaXMuZXhwZWN0ZWRBcmd1bWVudHNbaV0sIGFyZ3NbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKHRoaXMubWV0aG9kICsgXCIgcmVjZWl2ZWQgd3JvbmcgYXJndW1lbnRzIFwiICsgc2lub24uZm9ybWF0KGFyZ3MpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiwgZXhwZWN0ZWQgXCIgKyBzaW5vbi5mb3JtYXQodGhpcy5leHBlY3RlZEFyZ3VtZW50cykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYWxsb3dzQ2FsbDogZnVuY3Rpb24gYWxsb3dzQ2FsbCh0aGlzVmFsdWUsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tZXQoKSAmJiByZWNlaXZlZE1heENhbGxzKHRoaXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXCJleHBlY3RlZFRoaXNcIiBpbiB0aGlzICYmIHRoaXMuZXhwZWN0ZWRUaGlzICE9PSB0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghKFwiZXhwZWN0ZWRBcmd1bWVudHNcIiBpbiB0aGlzKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhcmdzID0gYXJncyB8fCBbXTtcblxuICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8IHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5leHBlY3RzRXhhY3RBcmdDb3VudCAmJlxuICAgICAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCAhPSB0aGlzLmV4cGVjdGVkQXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmV4cGVjdGVkQXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXZlcmlmeU1hdGNoZXIodGhpcy5leHBlY3RlZEFyZ3VtZW50c1tpXSxhcmdzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzaW5vbi5kZWVwRXF1YWwodGhpcy5leHBlY3RlZEFyZ3VtZW50c1tpXSwgYXJnc1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgd2l0aEFyZ3M6IGZ1bmN0aW9uIHdpdGhBcmdzKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB3aXRoRXhhY3RBcmdzOiBmdW5jdGlvbiB3aXRoRXhhY3RBcmdzKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud2l0aEFyZ3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGVjdHNFeGFjdEFyZ0NvdW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uOiBmdW5jdGlvbiBvbih0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGVjdGVkVGhpcyA9IHRoaXNWYWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSAodGhpcy5leHBlY3RlZEFyZ3VtZW50cyB8fCBbXSkuc2xpY2UoKTtcblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5leHBlY3RzRXhhY3RBcmdDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwoYXJncywgXCJbLi4uXVwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgY2FsbFN0ciA9IHNpbm9uLnNweUNhbGwudG9TdHJpbmcuY2FsbCh7XG4gICAgICAgICAgICAgICAgICAgIHByb3h5OiB0aGlzLm1ldGhvZCB8fCBcImFub255bW91cyBtb2NrIGV4cGVjdGF0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlID0gY2FsbFN0ci5yZXBsYWNlKFwiLCBbLi4uXCIsIFwiWywgLi4uXCIpICsgXCIgXCIgK1xuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZENhbGxDb3VudEluV29yZHModGhpcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tZXQoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJFeHBlY3RhdGlvbiBtZXQ6IFwiICsgbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gXCJFeHBlY3RlZCBcIiArIG1lc3NhZ2UgKyBcIiAoXCIgK1xuICAgICAgICAgICAgICAgICAgICBjYWxsQ291bnRJbldvcmRzKHRoaXMuY2FsbENvdW50KSArIFwiKVwiO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdmVyaWZ5OiBmdW5jdGlvbiB2ZXJpZnkoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLm1ldCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbm9uLmV4cGVjdGF0aW9uLmZhaWwodGhpcy50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5wYXNzKHRoaXMudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBwYXNzOiBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgICAgICAgIHNpbm9uLmFzc2VydC5wYXNzKG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZhaWw6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4Y2VwdGlvbiA9IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBleGNlcHRpb24ubmFtZSA9IFwiRXhwZWN0YXRpb25FcnJvclwiO1xuXG4gICAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0oKSk7XG5cbiAgICBpZiAoY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBtb2NrO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbm9uLm1vY2sgPSBtb2NrO1xuICAgIH1cbn0odHlwZW9mIHNpbm9uID09IFwib2JqZWN0XCIgJiYgc2lub24gfHwgbnVsbCkpO1xuIiwiLyoqXG4gKiBAZGVwZW5kIC4uL3Npbm9uLmpzXG4gKiBAZGVwZW5kIGNvbGxlY3Rpb24uanNcbiAqIEBkZXBlbmQgdXRpbC9mYWtlX3RpbWVycy5qc1xuICogQGRlcGVuZCB1dGlsL2Zha2Vfc2VydmVyX3dpdGhfY2xvY2suanNcbiAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgcGx1c3BsdXM6IGZhbHNlKi9cbi8qZ2xvYmFsIHJlcXVpcmUsIG1vZHVsZSovXG4vKipcbiAqIE1hbmFnZXMgZmFrZSBjb2xsZWN0aW9ucyBhcyB3ZWxsIGFzIGZha2UgdXRpbGl0aWVzIHN1Y2ggYXMgU2lub24nc1xuICogdGltZXJzIGFuZCBmYWtlIFhIUiBpbXBsZW1lbnRhdGlvbiBpbiBvbmUgY29udmVuaWVudCBvYmplY3QuXG4gKlxuICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgIHZhciBzaW5vbiA9IHJlcXVpcmUoXCIuLi9zaW5vblwiKTtcbiAgICBzaW5vbi5leHRlbmQoc2lub24sIHJlcXVpcmUoXCIuL3V0aWwvZmFrZV90aW1lcnNcIikpO1xufVxuXG4oZnVuY3Rpb24gKCkge1xuICAgIHZhciBwdXNoID0gW10ucHVzaDtcblxuICAgIGZ1bmN0aW9uIGV4cG9zZVZhbHVlKHNhbmRib3gsIGNvbmZpZywga2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLmluamVjdEludG8gJiYgIShrZXkgaW4gY29uZmlnLmluamVjdEludG8pICkge1xuICAgICAgICAgICAgY29uZmlnLmluamVjdEludG9ba2V5XSA9IHZhbHVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHVzaC5jYWxsKHNhbmRib3guYXJncywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcHJlcGFyZVNhbmRib3hGcm9tQ29uZmlnKGNvbmZpZykge1xuICAgICAgICB2YXIgc2FuZGJveCA9IHNpbm9uLmNyZWF0ZShzaW5vbi5zYW5kYm94KTtcblxuICAgICAgICBpZiAoY29uZmlnLnVzZUZha2VTZXJ2ZXIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29uZmlnLnVzZUZha2VTZXJ2ZXIgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHNhbmRib3guc2VydmVyUHJvdG90eXBlID0gY29uZmlnLnVzZUZha2VTZXJ2ZXI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNhbmRib3gudXNlRmFrZVNlcnZlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy51c2VGYWtlVGltZXJzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy51c2VGYWtlVGltZXJzID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBzYW5kYm94LnVzZUZha2VUaW1lcnMuYXBwbHkoc2FuZGJveCwgY29uZmlnLnVzZUZha2VUaW1lcnMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzYW5kYm94LnVzZUZha2VUaW1lcnMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzYW5kYm94O1xuICAgIH1cblxuICAgIHNpbm9uLnNhbmRib3ggPSBzaW5vbi5leHRlbmQoc2lub24uY3JlYXRlKHNpbm9uLmNvbGxlY3Rpb24pLCB7XG4gICAgICAgIHVzZUZha2VUaW1lcnM6IGZ1bmN0aW9uIHVzZUZha2VUaW1lcnMoKSB7XG4gICAgICAgICAgICB0aGlzLmNsb2NrID0gc2lub24udXNlRmFrZVRpbWVycy5hcHBseShzaW5vbiwgYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHRoaXMuY2xvY2spO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNlcnZlclByb3RvdHlwZTogc2lub24uZmFrZVNlcnZlcixcblxuICAgICAgICB1c2VGYWtlU2VydmVyOiBmdW5jdGlvbiB1c2VGYWtlU2VydmVyKCkge1xuICAgICAgICAgICAgdmFyIHByb3RvID0gdGhpcy5zZXJ2ZXJQcm90b3R5cGUgfHwgc2lub24uZmFrZVNlcnZlcjtcblxuICAgICAgICAgICAgaWYgKCFwcm90byB8fCAhcHJvdG8uY3JlYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2VydmVyID0gcHJvdG8uY3JlYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQodGhpcy5zZXJ2ZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluamVjdDogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgc2lub24uY29sbGVjdGlvbi5pbmplY3QuY2FsbCh0aGlzLCBvYmopO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5jbG9jaykge1xuICAgICAgICAgICAgICAgIG9iai5jbG9jayA9IHRoaXMuY2xvY2s7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlcnZlcikge1xuICAgICAgICAgICAgICAgIG9iai5zZXJ2ZXIgPSB0aGlzLnNlcnZlcjtcbiAgICAgICAgICAgICAgICBvYmoucmVxdWVzdHMgPSB0aGlzLnNlcnZlci5yZXF1ZXN0cztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNpbm9uLmNyZWF0ZShzaW5vbi5zYW5kYm94KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHNhbmRib3ggPSBwcmVwYXJlU2FuZGJveEZyb21Db25maWcoY29uZmlnKTtcbiAgICAgICAgICAgIHNhbmRib3guYXJncyA9IHNhbmRib3guYXJncyB8fCBbXTtcbiAgICAgICAgICAgIHZhciBwcm9wLCB2YWx1ZSwgZXhwb3NlZCA9IHNhbmRib3guaW5qZWN0KHt9KTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5wcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjb25maWcucHJvcGVydGllcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvcCA9IGNvbmZpZy5wcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGV4cG9zZWRbcHJvcF0gfHwgcHJvcCA9PSBcInNhbmRib3hcIiAmJiBzYW5kYm94O1xuICAgICAgICAgICAgICAgICAgICBleHBvc2VWYWx1ZShzYW5kYm94LCBjb25maWcsIHByb3AsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cG9zZVZhbHVlKHNhbmRib3gsIGNvbmZpZywgXCJzYW5kYm94XCIsIHZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNhbmRib3g7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHNpbm9uLnNhbmRib3gudXNlRmFrZVhNTEh0dHBSZXF1ZXN0ID0gc2lub24uc2FuZGJveC51c2VGYWtlU2VydmVyO1xuXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gc2lub24uc2FuZGJveDtcbiAgICB9XG59KCkpO1xuIiwiLyoqXG4gICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICAqIEBkZXBlbmQgY2FsbC5qc1xuICAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgcGx1c3BsdXM6IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24qL1xuLyoqXG4gICogU3B5IGZ1bmN0aW9uc1xuICAqXG4gICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gICogQGxpY2Vuc2UgQlNEXG4gICpcbiAgKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAgKi9cblwidXNlIHN0cmljdFwiO1xuXG4oZnVuY3Rpb24gKHNpbm9uKSB7XG4gICAgdmFyIGNvbW1vbkpTTW9kdWxlID0gdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHM7XG4gICAgdmFyIHB1c2ggPSBBcnJheS5wcm90b3R5cGUucHVzaDtcbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgdmFyIGNhbGxJZCA9IDA7XG5cbiAgICBpZiAoIXNpbm9uICYmIGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIHNpbm9uID0gcmVxdWlyZShcIi4uL3Npbm9uXCIpO1xuICAgIH1cblxuICAgIGlmICghc2lub24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNweShvYmplY3QsIHByb3BlcnR5KSB7XG4gICAgICAgIGlmICghcHJvcGVydHkgJiYgdHlwZW9mIG9iamVjdCA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBzcHkuY3JlYXRlKG9iamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9iamVjdCAmJiAhcHJvcGVydHkpIHtcbiAgICAgICAgICAgIHJldHVybiBzcHkuY3JlYXRlKGZ1bmN0aW9uICgpIHsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbWV0aG9kID0gb2JqZWN0W3Byb3BlcnR5XTtcbiAgICAgICAgcmV0dXJuIHNpbm9uLndyYXBNZXRob2Qob2JqZWN0LCBwcm9wZXJ0eSwgc3B5LmNyZWF0ZShtZXRob2QpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaGluZ0Zha2UoZmFrZXMsIGFyZ3MsIHN0cmljdCkge1xuICAgICAgICBpZiAoIWZha2VzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGZha2VzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKGZha2VzW2ldLm1hdGNoZXMoYXJncywgc3RyaWN0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWtlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGluY3JlbWVudENhbGxDb3VudCgpIHtcbiAgICAgICAgdGhpcy5jYWxsZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmNhbGxDb3VudCArPSAxO1xuICAgICAgICB0aGlzLm5vdENhbGxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNhbGxlZE9uY2UgPSB0aGlzLmNhbGxDb3VudCA9PSAxO1xuICAgICAgICB0aGlzLmNhbGxlZFR3aWNlID0gdGhpcy5jYWxsQ291bnQgPT0gMjtcbiAgICAgICAgdGhpcy5jYWxsZWRUaHJpY2UgPSB0aGlzLmNhbGxDb3VudCA9PSAzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUNhbGxQcm9wZXJ0aWVzKCkge1xuICAgICAgICB0aGlzLmZpcnN0Q2FsbCA9IHRoaXMuZ2V0Q2FsbCgwKTtcbiAgICAgICAgdGhpcy5zZWNvbmRDYWxsID0gdGhpcy5nZXRDYWxsKDEpO1xuICAgICAgICB0aGlzLnRoaXJkQ2FsbCA9IHRoaXMuZ2V0Q2FsbCgyKTtcbiAgICAgICAgdGhpcy5sYXN0Q2FsbCA9IHRoaXMuZ2V0Q2FsbCh0aGlzLmNhbGxDb3VudCAtIDEpO1xuICAgIH1cblxuICAgIHZhciB2YXJzID0gXCJhLGIsYyxkLGUsZixnLGgsaSxqLGssbFwiO1xuICAgIGZ1bmN0aW9uIGNyZWF0ZVByb3h5KGZ1bmMpIHtcbiAgICAgICAgLy8gUmV0YWluIHRoZSBmdW5jdGlvbiBsZW5ndGg6XG4gICAgICAgIHZhciBwO1xuICAgICAgICBpZiAoZnVuYy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGV2YWwoXCJwID0gKGZ1bmN0aW9uIHByb3h5KFwiICsgdmFycy5zdWJzdHJpbmcoMCwgZnVuYy5sZW5ndGggKiAyIC0gMSkgK1xuICAgICAgICAgICAgICAgIFwiKSB7IHJldHVybiBwLmludm9rZShmdW5jLCB0aGlzLCBzbGljZS5jYWxsKGFyZ3VtZW50cykpOyB9KTtcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwID0gZnVuY3Rpb24gcHJveHkoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHAuaW52b2tlKGZ1bmMsIHRoaXMsIHNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwO1xuICAgIH1cblxuICAgIHZhciB1dWlkID0gMDtcblxuICAgIC8vIFB1YmxpYyBBUElcbiAgICB2YXIgc3B5QXBpID0ge1xuICAgICAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMubm90Q2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGVkT25jZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jYWxsZWRUd2ljZSA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5jYWxsZWRUaHJpY2UgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY2FsbENvdW50ID0gMDtcbiAgICAgICAgICAgIHRoaXMuZmlyc3RDYWxsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuc2Vjb25kQ2FsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnRoaXJkQ2FsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmxhc3RDYWxsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuYXJncyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMudGhpc1ZhbHVlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5leGNlcHRpb25zID0gW107XG4gICAgICAgICAgICB0aGlzLmNhbGxJZHMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZha2VzKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZha2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmFrZXNbaV0ucmVzZXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoZnVuYykge1xuICAgICAgICAgICAgdmFyIG5hbWU7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBmdW5jID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gc2lub24uZnVuY3Rpb25OYW1lKGZ1bmMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcHJveHkgPSBjcmVhdGVQcm94eShmdW5jKTtcblxuICAgICAgICAgICAgc2lub24uZXh0ZW5kKHByb3h5LCBzcHkpO1xuICAgICAgICAgICAgZGVsZXRlIHByb3h5LmNyZWF0ZTtcbiAgICAgICAgICAgIHNpbm9uLmV4dGVuZChwcm94eSwgZnVuYyk7XG5cbiAgICAgICAgICAgIHByb3h5LnJlc2V0KCk7XG4gICAgICAgICAgICBwcm94eS5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgICAgICAgIHByb3h5LmRpc3BsYXlOYW1lID0gbmFtZSB8fCBcInNweVwiO1xuICAgICAgICAgICAgcHJveHkudG9TdHJpbmcgPSBzaW5vbi5mdW5jdGlvblRvU3RyaW5nO1xuICAgICAgICAgICAgcHJveHkuX2NyZWF0ZSA9IHNpbm9uLnNweS5jcmVhdGU7XG4gICAgICAgICAgICBwcm94eS5pZCA9IFwic3B5I1wiICsgdXVpZCsrO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJveHk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52b2tlOiBmdW5jdGlvbiBpbnZva2UoZnVuYywgdGhpc1ZhbHVlLCBhcmdzKSB7XG4gICAgICAgICAgICB2YXIgbWF0Y2hpbmcgPSBtYXRjaGluZ0Zha2UodGhpcy5mYWtlcywgYXJncyk7XG4gICAgICAgICAgICB2YXIgZXhjZXB0aW9uLCByZXR1cm5WYWx1ZTtcblxuICAgICAgICAgICAgaW5jcmVtZW50Q2FsbENvdW50LmNhbGwodGhpcyk7XG4gICAgICAgICAgICBwdXNoLmNhbGwodGhpcy50aGlzVmFsdWVzLCB0aGlzVmFsdWUpO1xuICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMuYXJncywgYXJncyk7XG4gICAgICAgICAgICBwdXNoLmNhbGwodGhpcy5jYWxsSWRzLCBjYWxsSWQrKyk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gbWF0Y2hpbmcuaW52b2tlKGZ1bmMsIHRoaXNWYWx1ZSwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuVmFsdWUgPSAodGhpcy5mdW5jIHx8IGZ1bmMpLmFwcGx5KHRoaXNWYWx1ZSwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNDYWxsID0gdGhpcy5nZXRDYWxsKHRoaXMuY2FsbENvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXNDYWxsLmNhbGxlZFdpdGhOZXcoKSAmJiB0eXBlb2YgcmV0dXJuVmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gdGhpc1ZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBleGNlcHRpb24gPSBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdXNoLmNhbGwodGhpcy5leGNlcHRpb25zLCBleGNlcHRpb24pO1xuICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMucmV0dXJuVmFsdWVzLCByZXR1cm5WYWx1ZSk7XG5cbiAgICAgICAgICAgIGNyZWF0ZUNhbGxQcm9wZXJ0aWVzLmNhbGwodGhpcyk7XG5cbiAgICAgICAgICAgIGlmIChleGNlcHRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldENhbGw6IGZ1bmN0aW9uIGdldENhbGwoaSkge1xuICAgICAgICAgICAgaWYgKGkgPCAwIHx8IGkgPj0gdGhpcy5jYWxsQ291bnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHNpbm9uLnNweUNhbGwodGhpcywgdGhpcy50aGlzVmFsdWVzW2ldLCB0aGlzLmFyZ3NbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlc1tpXSwgdGhpcy5leGNlcHRpb25zW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsSWRzW2ldKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDYWxsczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNhbGxzID0gW107XG4gICAgICAgICAgICB2YXIgaTtcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuY2FsbENvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICBjYWxscy5wdXNoKHRoaXMuZ2V0Q2FsbChpKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxscztcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsZWRCZWZvcmU6IGZ1bmN0aW9uIGNhbGxlZEJlZm9yZShzcHlGbikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNhbGxlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFzcHlGbi5jYWxsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbElkc1swXSA8IHNweUZuLmNhbGxJZHNbc3B5Rm4uY2FsbElkcy5sZW5ndGggLSAxXTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsZWRBZnRlcjogZnVuY3Rpb24gY2FsbGVkQWZ0ZXIoc3B5Rm4pIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jYWxsZWQgfHwgIXNweUZuLmNhbGxlZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbElkc1t0aGlzLmNhbGxDb3VudCAtIDFdID4gc3B5Rm4uY2FsbElkc1tzcHlGbi5jYWxsQ291bnQgLSAxXTtcbiAgICAgICAgfSxcblxuICAgICAgICB3aXRoQXJnczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmZha2VzKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbWF0Y2hpbmdGYWtlKHRoaXMuZmFrZXMsIGFyZ3MsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZmFrZXMgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9yaWdpbmFsID0gdGhpcztcbiAgICAgICAgICAgIHZhciBmYWtlID0gdGhpcy5fY3JlYXRlKCk7XG4gICAgICAgICAgICBmYWtlLm1hdGNoaW5nQWd1bWVudHMgPSBhcmdzO1xuICAgICAgICAgICAgZmFrZS5wYXJlbnQgPSB0aGlzO1xuICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMuZmFrZXMsIGZha2UpO1xuXG4gICAgICAgICAgICBmYWtlLndpdGhBcmdzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbC53aXRoQXJncy5hcHBseShvcmlnaW5hbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hcmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZha2UubWF0Y2hlcyh0aGlzLmFyZ3NbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGluY3JlbWVudENhbGxDb3VudC5jYWxsKGZha2UpO1xuICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwoZmFrZS50aGlzVmFsdWVzLCB0aGlzLnRoaXNWYWx1ZXNbaV0pO1xuICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwoZmFrZS5hcmdzLCB0aGlzLmFyZ3NbaV0pO1xuICAgICAgICAgICAgICAgICAgICBwdXNoLmNhbGwoZmFrZS5yZXR1cm5WYWx1ZXMsIHRoaXMucmV0dXJuVmFsdWVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKGZha2UuZXhjZXB0aW9ucywgdGhpcy5leGNlcHRpb25zW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKGZha2UuY2FsbElkcywgdGhpcy5jYWxsSWRzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjcmVhdGVDYWxsUHJvcGVydGllcy5jYWxsKGZha2UpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFrZTtcbiAgICAgICAgfSxcblxuICAgICAgICBtYXRjaGVzOiBmdW5jdGlvbiAoYXJncywgc3RyaWN0KSB7XG4gICAgICAgICAgICB2YXIgbWFyZ3MgPSB0aGlzLm1hdGNoaW5nQWd1bWVudHM7XG5cbiAgICAgICAgICAgIGlmIChtYXJncy5sZW5ndGggPD0gYXJncy5sZW5ndGggJiZcbiAgICAgICAgICAgICAgICBzaW5vbi5kZWVwRXF1YWwobWFyZ3MsIGFyZ3Muc2xpY2UoMCwgbWFyZ3MubGVuZ3RoKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIXN0cmljdCB8fCBtYXJncy5sZW5ndGggPT0gYXJncy5sZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgcHJpbnRmOiBmdW5jdGlvbiAoZm9ybWF0KSB7XG4gICAgICAgICAgICB2YXIgc3B5ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgdmFyIGZvcm1hdHRlcjtcblxuICAgICAgICAgICAgcmV0dXJuIChmb3JtYXQgfHwgXCJcIikucmVwbGFjZSgvJSguKS9nLCBmdW5jdGlvbiAobWF0Y2gsIHNwZWNpZnllcikge1xuICAgICAgICAgICAgICAgIGZvcm1hdHRlciA9IHNweUFwaS5mb3JtYXR0ZXJzW3NwZWNpZnllcl07XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcm1hdHRlciA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdHRlci5jYWxsKG51bGwsIHNweSwgYXJncyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaXNOYU4ocGFyc2VJbnQoc3BlY2lmeWVyLCAxMCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzaW5vbi5mb3JtYXQoYXJnc1tzcGVjaWZ5ZXIgLSAxXSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiJVwiICsgc3BlY2lmeWVyO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZGVsZWdhdGVUb0NhbGxzKG1ldGhvZCwgbWF0Y2hBbnksIGFjdHVhbCwgbm90Q2FsbGVkKSB7XG4gICAgICAgIHNweUFwaVttZXRob2RdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNhbGxlZCkge1xuICAgICAgICAgICAgICAgIGlmIChub3RDYWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vdENhbGxlZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjdXJyZW50Q2FsbDtcbiAgICAgICAgICAgIHZhciBtYXRjaGVzID0gMDtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmNhbGxDb3VudDsgaSA8IGw7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDYWxsID0gdGhpcy5nZXRDYWxsKGkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRDYWxsW2FjdHVhbCB8fCBtZXRob2RdLmFwcGx5KGN1cnJlbnRDYWxsLCBhcmd1bWVudHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hBbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcyA9PT0gdGhpcy5jYWxsQ291bnQ7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiY2FsbGVkT25cIiwgdHJ1ZSk7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiYWx3YXlzQ2FsbGVkT25cIiwgZmFsc2UsIFwiY2FsbGVkT25cIik7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiY2FsbGVkV2l0aFwiLCB0cnVlKTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJjYWxsZWRXaXRoTWF0Y2hcIiwgdHJ1ZSk7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiYWx3YXlzQ2FsbGVkV2l0aFwiLCBmYWxzZSwgXCJjYWxsZWRXaXRoXCIpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImFsd2F5c0NhbGxlZFdpdGhNYXRjaFwiLCBmYWxzZSwgXCJjYWxsZWRXaXRoTWF0Y2hcIik7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiY2FsbGVkV2l0aEV4YWN0bHlcIiwgdHJ1ZSk7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiYWx3YXlzQ2FsbGVkV2l0aEV4YWN0bHlcIiwgZmFsc2UsIFwiY2FsbGVkV2l0aEV4YWN0bHlcIik7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwibmV2ZXJDYWxsZWRXaXRoXCIsIGZhbHNlLCBcIm5vdENhbGxlZFdpdGhcIixcbiAgICAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfSk7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwibmV2ZXJDYWxsZWRXaXRoTWF0Y2hcIiwgZmFsc2UsIFwibm90Q2FsbGVkV2l0aE1hdGNoXCIsXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWU7IH0pO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcInRocmV3XCIsIHRydWUpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImFsd2F5c1RocmV3XCIsIGZhbHNlLCBcInRocmV3XCIpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcInJldHVybmVkXCIsIHRydWUpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImFsd2F5c1JldHVybmVkXCIsIGZhbHNlLCBcInJldHVybmVkXCIpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImNhbGxlZFdpdGhOZXdcIiwgdHJ1ZSk7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiYWx3YXlzQ2FsbGVkV2l0aE5ld1wiLCBmYWxzZSwgXCJjYWxsZWRXaXRoTmV3XCIpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImNhbGxBcmdcIiwgZmFsc2UsIFwiY2FsbEFyZ1dpdGhcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy50b1N0cmluZygpICsgXCIgY2Fubm90IGNhbGwgYXJnIHNpbmNlIGl0IHdhcyBub3QgeWV0IGludm9rZWQuXCIpO1xuICAgIH0pO1xuICAgIHNweUFwaS5jYWxsQXJnV2l0aCA9IHNweUFwaS5jYWxsQXJnO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImNhbGxBcmdPblwiLCBmYWxzZSwgXCJjYWxsQXJnT25XaXRoXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudG9TdHJpbmcoKSArIFwiIGNhbm5vdCBjYWxsIGFyZyBzaW5jZSBpdCB3YXMgbm90IHlldCBpbnZva2VkLlwiKTtcbiAgICB9KTtcbiAgICBzcHlBcGkuY2FsbEFyZ09uV2l0aCA9IHNweUFwaS5jYWxsQXJnT247XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwieWllbGRcIiwgZmFsc2UsIFwieWllbGRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy50b1N0cmluZygpICsgXCIgY2Fubm90IHlpZWxkIHNpbmNlIGl0IHdhcyBub3QgeWV0IGludm9rZWQuXCIpO1xuICAgIH0pO1xuICAgIC8vIFwiaW52b2tlQ2FsbGJhY2tcIiBpcyBhbiBhbGlhcyBmb3IgXCJ5aWVsZFwiIHNpbmNlIFwieWllbGRcIiBpcyBpbnZhbGlkIGluIHN0cmljdCBtb2RlLlxuICAgIHNweUFwaS5pbnZva2VDYWxsYmFjayA9IHNweUFwaS55aWVsZDtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJ5aWVsZE9uXCIsIGZhbHNlLCBcInlpZWxkT25cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy50b1N0cmluZygpICsgXCIgY2Fubm90IHlpZWxkIHNpbmNlIGl0IHdhcyBub3QgeWV0IGludm9rZWQuXCIpO1xuICAgIH0pO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcInlpZWxkVG9cIiwgZmFsc2UsIFwieWllbGRUb1wiLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudG9TdHJpbmcoKSArIFwiIGNhbm5vdCB5aWVsZCB0byAnXCIgKyBwcm9wZXJ0eSArXG4gICAgICAgICAgICBcIicgc2luY2UgaXQgd2FzIG5vdCB5ZXQgaW52b2tlZC5cIik7XG4gICAgfSk7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwieWllbGRUb09uXCIsIGZhbHNlLCBcInlpZWxkVG9PblwiLCBmdW5jdGlvbiAocHJvcGVydHkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudG9TdHJpbmcoKSArIFwiIGNhbm5vdCB5aWVsZCB0byAnXCIgKyBwcm9wZXJ0eSArXG4gICAgICAgICAgICBcIicgc2luY2UgaXQgd2FzIG5vdCB5ZXQgaW52b2tlZC5cIik7XG4gICAgfSk7XG5cbiAgICBzcHlBcGkuZm9ybWF0dGVycyA9IHtcbiAgICAgICAgXCJjXCI6IGZ1bmN0aW9uIChzcHkpIHtcbiAgICAgICAgICAgIHJldHVybiBzaW5vbi50aW1lc0luV29yZHMoc3B5LmNhbGxDb3VudCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgXCJuXCI6IGZ1bmN0aW9uIChzcHkpIHtcbiAgICAgICAgICAgIHJldHVybiBzcHkudG9TdHJpbmcoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBcIkNcIjogZnVuY3Rpb24gKHNweSkge1xuICAgICAgICAgICAgdmFyIGNhbGxzID0gW107XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gc3B5LmNhbGxDb3VudDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIHZhciBzdHJpbmdpZmllZENhbGwgPSBcIiAgICBcIiArIHNweS5nZXRDYWxsKGkpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgaWYgKC9cXG4vLnRlc3QoY2FsbHNbaSAtIDFdKSkge1xuICAgICAgICAgICAgICAgICAgICBzdHJpbmdpZmllZENhbGwgPSBcIlxcblwiICsgc3RyaW5naWZpZWRDYWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwdXNoLmNhbGwoY2FsbHMsIHN0cmluZ2lmaWVkQ2FsbCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxscy5sZW5ndGggPiAwID8gXCJcXG5cIiArIGNhbGxzLmpvaW4oXCJcXG5cIikgOiBcIlwiO1xuICAgICAgICB9LFxuXG4gICAgICAgIFwidFwiOiBmdW5jdGlvbiAoc3B5KSB7XG4gICAgICAgICAgICB2YXIgb2JqZWN0cyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHNweS5jYWxsQ291bnQ7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBwdXNoLmNhbGwob2JqZWN0cywgc2lub24uZm9ybWF0KHNweS50aGlzVmFsdWVzW2ldKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvYmplY3RzLmpvaW4oXCIsIFwiKTtcbiAgICAgICAgfSxcblxuICAgICAgICBcIipcIjogZnVuY3Rpb24gKHNweSwgYXJncykge1xuICAgICAgICAgICAgdmFyIGZvcm1hdHRlZCA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGFyZ3MubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcHVzaC5jYWxsKGZvcm1hdHRlZCwgc2lub24uZm9ybWF0KGFyZ3NbaV0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdHRlZC5qb2luKFwiLCBcIik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2lub24uZXh0ZW5kKHNweSwgc3B5QXBpKTtcblxuICAgIHNweS5zcHlDYWxsID0gc2lub24uc3B5Q2FsbDtcblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHNweTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi5zcHkgPSBzcHk7XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsKSk7XG4iLCIvKipcbiAqIEBkZXBlbmQgLi4vc2lub24uanNcbiAqIEBkZXBlbmQgc3B5LmpzXG4gKiBAZGVwZW5kIGJlaGF2aW9yLmpzXG4gKi9cbi8qanNsaW50IGVxZXFlcTogZmFsc2UsIG9uZXZhcjogZmFsc2UqL1xuLypnbG9iYWwgbW9kdWxlLCByZXF1aXJlLCBzaW5vbiovXG4vKipcbiAqIFN0dWIgZnVuY3Rpb25zXG4gKlxuICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3R1YihvYmplY3QsIHByb3BlcnR5LCBmdW5jKSB7XG4gICAgICAgIGlmICghIWZ1bmMgJiYgdHlwZW9mIGZ1bmMgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ3VzdG9tIHN0dWIgc2hvdWxkIGJlIGZ1bmN0aW9uXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdyYXBwZXI7XG5cbiAgICAgICAgaWYgKGZ1bmMpIHtcbiAgICAgICAgICAgIHdyYXBwZXIgPSBzaW5vbi5zcHkgJiYgc2lub24uc3B5LmNyZWF0ZSA/IHNpbm9uLnNweS5jcmVhdGUoZnVuYykgOiBmdW5jO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd3JhcHBlciA9IHN0dWIuY3JlYXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9iamVjdCAmJiB0eXBlb2YgcHJvcGVydHkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBzaW5vbi5zdHViLmNyZWF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2Ygb2JqZWN0ID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3RbcHJvcF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBzdHViKG9iamVjdCwgcHJvcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNpbm9uLndyYXBNZXRob2Qob2JqZWN0LCBwcm9wZXJ0eSwgd3JhcHBlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGVmYXVsdEJlaGF2aW9yKHN0dWIpIHtcbiAgICAgICAgcmV0dXJuIHN0dWIuZGVmYXVsdEJlaGF2aW9yIHx8IGdldFBhcmVudEJlaGF2aW91cihzdHViKSB8fCBzaW5vbi5iZWhhdmlvci5jcmVhdGUoc3R1Yik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0UGFyZW50QmVoYXZpb3VyKHN0dWIpIHtcbiAgICAgICAgcmV0dXJuIChzdHViLnBhcmVudCAmJiBnZXRDdXJyZW50QmVoYXZpb3Ioc3R1Yi5wYXJlbnQpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDdXJyZW50QmVoYXZpb3Ioc3R1Yikge1xuICAgICAgICB2YXIgYmVoYXZpb3IgPSBzdHViLmJlaGF2aW9yc1tzdHViLmNhbGxDb3VudCAtIDFdO1xuICAgICAgICByZXR1cm4gYmVoYXZpb3IgJiYgYmVoYXZpb3IuaXNQcmVzZW50KCkgPyBiZWhhdmlvciA6IGdldERlZmF1bHRCZWhhdmlvcihzdHViKTtcbiAgICB9XG5cbiAgICB2YXIgdXVpZCA9IDA7XG5cbiAgICBzaW5vbi5leHRlbmQoc3R1YiwgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHByb3RvID0ge1xuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZ1bmN0aW9uU3R1YiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldEN1cnJlbnRCZWhhdmlvcihmdW5jdGlvblN0dWIpLmludm9rZSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvblN0dWIuaWQgPSBcInN0dWIjXCIgKyB1dWlkKys7XG4gICAgICAgICAgICAgICAgdmFyIG9yaWcgPSBmdW5jdGlvblN0dWI7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb25TdHViID0gc2lub24uc3B5LmNyZWF0ZShmdW5jdGlvblN0dWIpO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uU3R1Yi5mdW5jID0gb3JpZztcblxuICAgICAgICAgICAgICAgIHNpbm9uLmV4dGVuZChmdW5jdGlvblN0dWIsIHN0dWIpO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uU3R1Yi5fY3JlYXRlID0gc2lub24uc3R1Yi5jcmVhdGU7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb25TdHViLmRpc3BsYXlOYW1lID0gXCJzdHViXCI7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb25TdHViLnRvU3RyaW5nID0gc2lub24uZnVuY3Rpb25Ub1N0cmluZztcblxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uU3R1Yi5kZWZhdWx0QmVoYXZpb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uU3R1Yi5iZWhhdmlvcnMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvblN0dWI7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXNldEJlaGF2aW9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRCZWhhdmlvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5iZWhhdmlvcnMgPSBbXTtcblxuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnJldHVyblZhbHVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnJldHVybkFyZ0F0O1xuICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuVGhpcyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmFrZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuZmFrZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFrZXNbaV0ucmVzZXRCZWhhdmlvcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25DYWxsOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5iZWhhdmlvcnNbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmVoYXZpb3JzW2luZGV4XSA9IHNpbm9uLmJlaGF2aW9yLmNyZWF0ZSh0aGlzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5iZWhhdmlvcnNbaW5kZXhdO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25GaXJzdENhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uQ2FsbCgwKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uU2Vjb25kQ2FsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub25DYWxsKDEpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgb25UaGlyZENhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uQ2FsbCgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKHZhciBtZXRob2QgaW4gc2lub24uYmVoYXZpb3IpIHtcbiAgICAgICAgICAgIGlmIChzaW5vbi5iZWhhdmlvci5oYXNPd25Qcm9wZXJ0eShtZXRob2QpICYmXG4gICAgICAgICAgICAgICAgIXByb3RvLmhhc093blByb3BlcnR5KG1ldGhvZCkgJiZcbiAgICAgICAgICAgICAgICBtZXRob2QgIT0gJ2NyZWF0ZScgJiZcbiAgICAgICAgICAgICAgICBtZXRob2QgIT0gJ3dpdGhBcmdzJyAmJlxuICAgICAgICAgICAgICAgIG1ldGhvZCAhPSAnaW52b2tlJykge1xuICAgICAgICAgICAgICAgIHByb3RvW21ldGhvZF0gPSAoZnVuY3Rpb24oYmVoYXZpb3JNZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0QmVoYXZpb3IgPSB0aGlzLmRlZmF1bHRCZWhhdmlvciB8fCBzaW5vbi5iZWhhdmlvci5jcmVhdGUodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRlZmF1bHRCZWhhdmlvcltiZWhhdmlvck1ldGhvZF0uYXBwbHkodGhpcy5kZWZhdWx0QmVoYXZpb3IsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KG1ldGhvZCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb3RvO1xuICAgIH0oKSkpO1xuXG4gICAgaWYgKGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gc3R1YjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi5zdHViID0gc3R1YjtcbiAgICB9XG59KHR5cGVvZiBzaW5vbiA9PSBcIm9iamVjdFwiICYmIHNpbm9uIHx8IG51bGwpKTtcbiIsIi8qKlxuICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICogQGRlcGVuZCBzdHViLmpzXG4gKiBAZGVwZW5kIG1vY2suanNcbiAqIEBkZXBlbmQgc2FuZGJveC5qc1xuICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlLCBmb3JpbjogdHJ1ZSwgcGx1c3BsdXM6IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24qL1xuLyoqXG4gKiBUZXN0IGZ1bmN0aW9uLCBzYW5kYm94ZXMgZmFrZXNcbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuKGZ1bmN0aW9uIChzaW5vbikge1xuICAgIHZhciBjb21tb25KU01vZHVsZSA9IHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzO1xuXG4gICAgaWYgKCFzaW5vbiAmJiBjb21tb25KU01vZHVsZSkge1xuICAgICAgICBzaW5vbiA9IHJlcXVpcmUoXCIuLi9zaW5vblwiKTtcbiAgICB9XG5cbiAgICBpZiAoIXNpbm9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZXN0KGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciB0eXBlID0gdHlwZW9mIGNhbGxiYWNrO1xuXG4gICAgICAgIGlmICh0eXBlICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInNpbm9uLnRlc3QgbmVlZHMgdG8gd3JhcCBhIHRlc3QgZnVuY3Rpb24sIGdvdCBcIiArIHR5cGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjb25maWcgPSBzaW5vbi5nZXRDb25maWcoc2lub24uY29uZmlnKTtcbiAgICAgICAgICAgIGNvbmZpZy5pbmplY3RJbnRvID0gY29uZmlnLmluamVjdEludG9UaGlzICYmIHRoaXMgfHwgY29uZmlnLmluamVjdEludG87XG4gICAgICAgICAgICB2YXIgc2FuZGJveCA9IHNpbm9uLnNhbmRib3guY3JlYXRlKGNvbmZpZyk7XG4gICAgICAgICAgICB2YXIgZXhjZXB0aW9uLCByZXN1bHQ7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykuY29uY2F0KHNhbmRib3guYXJncyk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gY2FsbGJhY2suYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBleGNlcHRpb24gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBzYW5kYm94LnJlc3RvcmUoKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBleGNlcHRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzYW5kYm94LnZlcmlmeUFuZFJlc3RvcmUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB0ZXN0LmNvbmZpZyA9IHtcbiAgICAgICAgaW5qZWN0SW50b1RoaXM6IHRydWUsXG4gICAgICAgIGluamVjdEludG86IG51bGwsXG4gICAgICAgIHByb3BlcnRpZXM6IFtcInNweVwiLCBcInN0dWJcIiwgXCJtb2NrXCIsIFwiY2xvY2tcIiwgXCJzZXJ2ZXJcIiwgXCJyZXF1ZXN0c1wiXSxcbiAgICAgICAgdXNlRmFrZVRpbWVyczogdHJ1ZSxcbiAgICAgICAgdXNlRmFrZVNlcnZlcjogdHJ1ZVxuICAgIH07XG5cbiAgICBpZiAoY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB0ZXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbm9uLnRlc3QgPSB0ZXN0O1xuICAgIH1cbn0odHlwZW9mIHNpbm9uID09IFwib2JqZWN0XCIgJiYgc2lub24gfHwgbnVsbCkpO1xuIiwiLyoqXG4gKiBAZGVwZW5kIC4uL3Npbm9uLmpzXG4gKiBAZGVwZW5kIHRlc3QuanNcbiAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgZXFlcWVxOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICogVGVzdCBjYXNlLCBzYW5kYm94ZXMgYWxsIHRlc3QgZnVuY3Rpb25zXG4gKlxuICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbiB8fCAhT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlVGVzdChwcm9wZXJ0eSwgc2V0VXAsIHRlYXJEb3duKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoc2V0VXApIHtcbiAgICAgICAgICAgICAgICBzZXRVcC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZXhjZXB0aW9uLCByZXN1bHQ7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gcHJvcGVydHkuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBleGNlcHRpb24gPSBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGVhckRvd24pIHtcbiAgICAgICAgICAgICAgICB0ZWFyRG93bi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlc3RDYXNlKHRlc3RzLCBwcmVmaXgpIHtcbiAgICAgICAgLypqc2w6aWdub3JlKi9cbiAgICAgICAgaWYgKCF0ZXN0cyB8fCB0eXBlb2YgdGVzdHMgIT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInNpbm9uLnRlc3RDYXNlIG5lZWRzIGFuIG9iamVjdCB3aXRoIHRlc3QgZnVuY3Rpb25zXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8qanNsOmVuZCovXG5cbiAgICAgICAgcHJlZml4ID0gcHJlZml4IHx8IFwidGVzdFwiO1xuICAgICAgICB2YXIgclByZWZpeCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBwcmVmaXgpO1xuICAgICAgICB2YXIgbWV0aG9kcyA9IHt9LCB0ZXN0TmFtZSwgcHJvcGVydHksIG1ldGhvZDtcbiAgICAgICAgdmFyIHNldFVwID0gdGVzdHMuc2V0VXA7XG4gICAgICAgIHZhciB0ZWFyRG93biA9IHRlc3RzLnRlYXJEb3duO1xuXG4gICAgICAgIGZvciAodGVzdE5hbWUgaW4gdGVzdHMpIHtcbiAgICAgICAgICAgIGlmICh0ZXN0cy5oYXNPd25Qcm9wZXJ0eSh0ZXN0TmFtZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IHRlc3RzW3Rlc3ROYW1lXTtcblxuICAgICAgICAgICAgICAgIGlmICgvXihzZXRVcHx0ZWFyRG93bikkLy50ZXN0KHRlc3ROYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHByb3BlcnR5ID09IFwiZnVuY3Rpb25cIiAmJiByUHJlZml4LnRlc3QodGVzdE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9IHByb3BlcnR5O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXRVcCB8fCB0ZWFyRG93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gY3JlYXRlVGVzdChwcm9wZXJ0eSwgc2V0VXAsIHRlYXJEb3duKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbdGVzdE5hbWVdID0gc2lub24udGVzdChtZXRob2QpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZHNbdGVzdE5hbWVdID0gdGVzdHNbdGVzdE5hbWVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtZXRob2RzO1xuICAgIH1cblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHRlc3RDYXNlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbm9uLnRlc3RDYXNlID0gdGVzdENhc2U7XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsKSk7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBwbHVzcGx1czogZmFsc2UsIGV2aWw6IHRydWUsIG9uZXZhcjogZmFsc2UsIGJyb3dzZXI6IHRydWUsIGZvcmluOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHdpbmRvdyovXG4vKipcbiAqIEZha2UgdGltZXIgQVBJXG4gKiBzZXRUaW1lb3V0XG4gKiBzZXRJbnRlcnZhbFxuICogY2xlYXJUaW1lb3V0XG4gKiBjbGVhckludGVydmFsXG4gKiB0aWNrXG4gKiByZXNldFxuICogRGF0ZVxuICpcbiAqIEluc3BpcmVkIGJ5IGpzVW5pdE1vY2tUaW1lT3V0IGZyb20gSnNVbml0XG4gKlxuICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICh0eXBlb2Ygc2lub24gPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZhciBzaW5vbiA9IHt9O1xufVxuXG4oZnVuY3Rpb24gKGdsb2JhbCkge1xuICAgIHZhciBpZCA9IDE7XG5cbiAgICBmdW5jdGlvbiBhZGRUaW1lcihhcmdzLCByZWN1cnJpbmcpIHtcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGdW5jdGlvbiByZXF1aXJlcyBhdCBsZWFzdCAxIHBhcmFtZXRlclwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgbXVzdCBiZSBwcm92aWRlZCB0byB0aW1lciBjYWxsc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b0lkID0gaWQrKztcbiAgICAgICAgdmFyIGRlbGF5ID0gYXJnc1sxXSB8fCAwO1xuXG4gICAgICAgIGlmICghdGhpcy50aW1lb3V0cykge1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50aW1lb3V0c1t0b0lkXSA9IHtcbiAgICAgICAgICAgIGlkOiB0b0lkLFxuICAgICAgICAgICAgZnVuYzogYXJnc1swXSxcbiAgICAgICAgICAgIGNhbGxBdDogdGhpcy5ub3cgKyBkZWxheSxcbiAgICAgICAgICAgIGludm9rZUFyZ3M6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3MsIDIpXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHJlY3VycmluZyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0c1t0b0lkXS5pbnRlcnZhbCA9IGRlbGF5O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRvSWQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VUaW1lKHN0cikge1xuICAgICAgICBpZiAoIXN0cikge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3RyaW5ncyA9IHN0ci5zcGxpdChcIjpcIik7XG4gICAgICAgIHZhciBsID0gc3RyaW5ncy5sZW5ndGgsIGkgPSBsO1xuICAgICAgICB2YXIgbXMgPSAwLCBwYXJzZWQ7XG5cbiAgICAgICAgaWYgKGwgPiAzIHx8ICEvXihcXGRcXGQ6KXswLDJ9XFxkXFxkPyQvLnRlc3Qoc3RyKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidGljayBvbmx5IHVuZGVyc3RhbmRzIG51bWJlcnMgYW5kICdoOm06cydcIik7XG4gICAgICAgIH1cblxuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBwYXJzZWQgPSBwYXJzZUludChzdHJpbmdzW2ldLCAxMCk7XG5cbiAgICAgICAgICAgIGlmIChwYXJzZWQgPj0gNjApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHRpbWUgXCIgKyBzdHIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtcyArPSBwYXJzZWQgKiBNYXRoLnBvdyg2MCwgKGwgLSBpIC0gMSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1zICogMTAwMDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVPYmplY3Qob2JqZWN0KSB7XG4gICAgICAgIHZhciBuZXdPYmplY3Q7XG5cbiAgICAgICAgaWYgKE9iamVjdC5jcmVhdGUpIHtcbiAgICAgICAgICAgIG5ld09iamVjdCA9IE9iamVjdC5jcmVhdGUob2JqZWN0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBGID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICBGLnByb3RvdHlwZSA9IG9iamVjdDtcbiAgICAgICAgICAgIG5ld09iamVjdCA9IG5ldyBGKCk7XG4gICAgICAgIH1cblxuICAgICAgICBuZXdPYmplY3QuRGF0ZS5jbG9jayA9IG5ld09iamVjdDtcbiAgICAgICAgcmV0dXJuIG5ld09iamVjdDtcbiAgICB9XG5cbiAgICBzaW5vbi5jbG9jayA9IHtcbiAgICAgICAgbm93OiAwLFxuXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKG5vdykge1xuICAgICAgICAgICAgdmFyIGNsb2NrID0gY3JlYXRlT2JqZWN0KHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG5vdyA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgY2xvY2subm93ID0gbm93O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoISFub3cgJiYgdHlwZW9mIG5vdyA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIm5vdyBzaG91bGQgYmUgbWlsbGlzZWNvbmRzIHNpbmNlIFVOSVggZXBvY2hcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjbG9jaztcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRUaW1lb3V0OiBmdW5jdGlvbiBzZXRUaW1lb3V0KGNhbGxiYWNrLCB0aW1lb3V0KSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkVGltZXIuY2FsbCh0aGlzLCBhcmd1bWVudHMsIGZhbHNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhclRpbWVvdXQ6IGZ1bmN0aW9uIGNsZWFyVGltZW91dCh0aW1lcklkKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aW1lcklkIGluIHRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50aW1lb3V0c1t0aW1lcklkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBzZXRJbnRlcnZhbDogZnVuY3Rpb24gc2V0SW50ZXJ2YWwoY2FsbGJhY2ssIHRpbWVvdXQpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRUaW1lci5jYWxsKHRoaXMsIGFyZ3VtZW50cywgdHJ1ZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJJbnRlcnZhbDogZnVuY3Rpb24gY2xlYXJJbnRlcnZhbCh0aW1lcklkKSB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dCh0aW1lcklkKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRJbW1lZGlhdGU6IGZ1bmN0aW9uIHNldEltbWVkaWF0ZShjYWxsYmFjaykge1xuICAgICAgICAgICAgdmFyIHBhc3NUaHJ1QXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgICAgIHJldHVybiBhZGRUaW1lci5jYWxsKHRoaXMsIFtjYWxsYmFjaywgMF0uY29uY2F0KHBhc3NUaHJ1QXJncyksIGZhbHNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGVhckltbWVkaWF0ZTogZnVuY3Rpb24gY2xlYXJJbW1lZGlhdGUodGltZXJJZCkge1xuICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdGljazogZnVuY3Rpb24gdGljayhtcykge1xuICAgICAgICAgICAgbXMgPSB0eXBlb2YgbXMgPT0gXCJudW1iZXJcIiA/IG1zIDogcGFyc2VUaW1lKG1zKTtcbiAgICAgICAgICAgIHZhciB0aWNrRnJvbSA9IHRoaXMubm93LCB0aWNrVG8gPSB0aGlzLm5vdyArIG1zLCBwcmV2aW91cyA9IHRoaXMubm93O1xuICAgICAgICAgICAgdmFyIHRpbWVyID0gdGhpcy5maXJzdFRpbWVySW5SYW5nZSh0aWNrRnJvbSwgdGlja1RvKTtcblxuICAgICAgICAgICAgdmFyIGZpcnN0RXhjZXB0aW9uO1xuICAgICAgICAgICAgd2hpbGUgKHRpbWVyICYmIHRpY2tGcm9tIDw9IHRpY2tUbykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzW3RpbWVyLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aWNrRnJvbSA9IHRoaXMubm93ID0gdGltZXIuY2FsbEF0O1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbFRpbWVyKHRpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICAgIGZpcnN0RXhjZXB0aW9uID0gZmlyc3RFeGNlcHRpb24gfHwgZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRpbWVyID0gdGhpcy5maXJzdFRpbWVySW5SYW5nZShwcmV2aW91cywgdGlja1RvKTtcbiAgICAgICAgICAgICAgICBwcmV2aW91cyA9IHRpY2tGcm9tO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLm5vdyA9IHRpY2tUbztcblxuICAgICAgICAgICAgaWYgKGZpcnN0RXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgIHRocm93IGZpcnN0RXhjZXB0aW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ub3c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmlyc3RUaW1lckluUmFuZ2U6IGZ1bmN0aW9uIChmcm9tLCB0bykge1xuICAgICAgICAgICAgdmFyIHRpbWVyLCBzbWFsbGVzdCA9IG51bGwsIG9yaWdpbmFsVGltZXI7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0cy5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dHNbaWRdLmNhbGxBdCA8IGZyb20gfHwgdGhpcy50aW1lb3V0c1tpZF0uY2FsbEF0ID4gdG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNtYWxsZXN0ID09PSBudWxsIHx8IHRoaXMudGltZW91dHNbaWRdLmNhbGxBdCA8IHNtYWxsZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFRpbWVyID0gdGhpcy50aW1lb3V0c1tpZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBzbWFsbGVzdCA9IHRoaXMudGltZW91dHNbaWRdLmNhbGxBdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuYzogdGhpcy50aW1lb3V0c1tpZF0uZnVuYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsQXQ6IHRoaXMudGltZW91dHNbaWRdLmNhbGxBdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRlcnZhbDogdGhpcy50aW1lb3V0c1tpZF0uaW50ZXJ2YWwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXMudGltZW91dHNbaWRdLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludm9rZUFyZ3M6IHRoaXMudGltZW91dHNbaWRdLmludm9rZUFyZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aW1lciB8fCBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGxUaW1lcjogZnVuY3Rpb24gKHRpbWVyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRpbWVyLmludGVydmFsID09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVvdXRzW3RpbWVyLmlkXS5jYWxsQXQgKz0gdGltZXIuaW50ZXJ2YWw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRpbWVvdXRzW3RpbWVyLmlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRpbWVyLmZ1bmMgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVyLmZ1bmMuYXBwbHkobnVsbCwgdGltZXIuaW52b2tlQXJncyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZXZhbCh0aW1lci5mdW5jKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgIHZhciBleGNlcHRpb24gPSBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXRoaXMudGltZW91dHNbdGltZXIuaWRdKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dHMgPSB7fTtcbiAgICAgICAgfSxcblxuICAgICAgICBEYXRlOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIE5hdGl2ZURhdGUgPSBEYXRlO1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBDbG9ja0RhdGUoeWVhciwgbW9udGgsIGRhdGUsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtcykge1xuICAgICAgICAgICAgICAgIC8vIERlZmVuc2l2ZSBhbmQgdmVyYm9zZSB0byBhdm9pZCBwb3RlbnRpYWwgaGFybSBpbiBwYXNzaW5nXG4gICAgICAgICAgICAgICAgLy8gZXhwbGljaXQgdW5kZWZpbmVkIHdoZW4gdXNlciBkb2VzIG5vdCBwYXNzIGFyZ3VtZW50XG4gICAgICAgICAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZURhdGUoQ2xvY2tEYXRlLmNsb2NrLm5vdyk7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZURhdGUoeWVhcik7XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZURhdGUoeWVhciwgbW9udGgpO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVEYXRlKHllYXIsIG1vbnRoLCBkYXRlKTtcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTmF0aXZlRGF0ZSh5ZWFyLCBtb250aCwgZGF0ZSwgaG91cik7XG4gICAgICAgICAgICAgICAgY2FzZSA1OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZURhdGUoeWVhciwgbW9udGgsIGRhdGUsIGhvdXIsIG1pbnV0ZSk7XG4gICAgICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZURhdGUoeWVhciwgbW9udGgsIGRhdGUsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kKTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZURhdGUoeWVhciwgbW9udGgsIGRhdGUsIGhvdXIsIG1pbnV0ZSwgc2Vjb25kLCBtcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbWlycm9yRGF0ZVByb3BlcnRpZXMoQ2xvY2tEYXRlLCBOYXRpdmVEYXRlKTtcbiAgICAgICAgfSgpKVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBtaXJyb3JEYXRlUHJvcGVydGllcyh0YXJnZXQsIHNvdXJjZSkge1xuICAgICAgICBpZiAoc291cmNlLm5vdykge1xuICAgICAgICAgICAgdGFyZ2V0Lm5vdyA9IGZ1bmN0aW9uIG5vdygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFyZ2V0LmNsb2NrLm5vdztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgdGFyZ2V0Lm5vdztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzb3VyY2UudG9Tb3VyY2UpIHtcbiAgICAgICAgICAgIHRhcmdldC50b1NvdXJjZSA9IGZ1bmN0aW9uIHRvU291cmNlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzb3VyY2UudG9Tb3VyY2UoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgdGFyZ2V0LnRvU291cmNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGFyZ2V0LnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgICAgICAgICByZXR1cm4gc291cmNlLnRvU3RyaW5nKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGFyZ2V0LnByb3RvdHlwZSA9IHNvdXJjZS5wcm90b3R5cGU7XG4gICAgICAgIHRhcmdldC5wYXJzZSA9IHNvdXJjZS5wYXJzZTtcbiAgICAgICAgdGFyZ2V0LlVUQyA9IHNvdXJjZS5VVEM7XG4gICAgICAgIHRhcmdldC5wcm90b3R5cGUudG9VVENTdHJpbmcgPSBzb3VyY2UucHJvdG90eXBlLnRvVVRDU3RyaW5nO1xuXG4gICAgICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlKSB7XG4gICAgICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gc291cmNlW3Byb3BdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICB2YXIgbWV0aG9kcyA9IFtcIkRhdGVcIiwgXCJzZXRUaW1lb3V0XCIsIFwic2V0SW50ZXJ2YWxcIixcbiAgICAgICAgICAgICAgICAgICBcImNsZWFyVGltZW91dFwiLCBcImNsZWFySW50ZXJ2YWxcIl07XG5cbiAgICBpZiAodHlwZW9mIGdsb2JhbC5zZXRJbW1lZGlhdGUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgbWV0aG9kcy5wdXNoKFwic2V0SW1tZWRpYXRlXCIpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgZ2xvYmFsLmNsZWFySW1tZWRpYXRlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIG1ldGhvZHMucHVzaChcImNsZWFySW1tZWRpYXRlXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc3RvcmUoKSB7XG4gICAgICAgIHZhciBtZXRob2Q7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLm1ldGhvZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBtZXRob2QgPSB0aGlzLm1ldGhvZHNbaV07XG5cbiAgICAgICAgICAgIGlmIChnbG9iYWxbbWV0aG9kXS5oYWRPd25Qcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIGdsb2JhbFttZXRob2RdID0gdGhpc1tcIl9cIiArIG1ldGhvZF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxbbWV0aG9kXTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUHJldmVudCBtdWx0aXBsZSBleGVjdXRpb25zIHdoaWNoIHdpbGwgY29tcGxldGVseSByZW1vdmUgdGhlc2UgcHJvcHNcbiAgICAgICAgdGhpcy5tZXRob2RzID0gW107XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3R1Ykdsb2JhbChtZXRob2QsIGNsb2NrKSB7XG4gICAgICAgIGNsb2NrW21ldGhvZF0uaGFkT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZ2xvYmFsLCBtZXRob2QpO1xuICAgICAgICBjbG9ja1tcIl9cIiArIG1ldGhvZF0gPSBnbG9iYWxbbWV0aG9kXTtcblxuICAgICAgICBpZiAobWV0aG9kID09IFwiRGF0ZVwiKSB7XG4gICAgICAgICAgICB2YXIgZGF0ZSA9IG1pcnJvckRhdGVQcm9wZXJ0aWVzKGNsb2NrW21ldGhvZF0sIGdsb2JhbFttZXRob2RdKTtcbiAgICAgICAgICAgIGdsb2JhbFttZXRob2RdID0gZGF0ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdsb2JhbFttZXRob2RdID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjbG9ja1ttZXRob2RdLmFwcGx5KGNsb2NrLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBjbG9ja1ttZXRob2RdKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNsb2NrW21ldGhvZF0uaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsW21ldGhvZF1bcHJvcF0gPSBjbG9ja1ttZXRob2RdW3Byb3BdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGdsb2JhbFttZXRob2RdLmNsb2NrID0gY2xvY2s7XG4gICAgfVxuXG4gICAgc2lub24udXNlRmFrZVRpbWVycyA9IGZ1bmN0aW9uIHVzZUZha2VUaW1lcnMobm93KSB7XG4gICAgICAgIHZhciBjbG9jayA9IHNpbm9uLmNsb2NrLmNyZWF0ZShub3cpO1xuICAgICAgICBjbG9jay5yZXN0b3JlID0gcmVzdG9yZTtcbiAgICAgICAgY2xvY2subWV0aG9kcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBub3cgPT0gXCJudW1iZXJcIiA/IDEgOiAwKTtcblxuICAgICAgICBpZiAoY2xvY2subWV0aG9kcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNsb2NrLm1ldGhvZHMgPSBtZXRob2RzO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjbG9jay5tZXRob2RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgc3R1Ykdsb2JhbChjbG9jay5tZXRob2RzW2ldLCBjbG9jayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2xvY2s7XG4gICAgfTtcbn0odHlwZW9mIGdsb2JhbCAhPSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBnbG9iYWwgIT09IFwiZnVuY3Rpb25cIiA/IGdsb2JhbCA6IHRoaXMpKTtcblxuc2lub24udGltZXJzID0ge1xuICAgIHNldFRpbWVvdXQ6IHNldFRpbWVvdXQsXG4gICAgY2xlYXJUaW1lb3V0OiBjbGVhclRpbWVvdXQsXG4gICAgc2V0SW1tZWRpYXRlOiAodHlwZW9mIHNldEltbWVkaWF0ZSAhPT0gXCJ1bmRlZmluZWRcIiA/IHNldEltbWVkaWF0ZSA6IHVuZGVmaW5lZCksXG4gICAgY2xlYXJJbW1lZGlhdGU6ICh0eXBlb2YgY2xlYXJJbW1lZGlhdGUgIT09IFwidW5kZWZpbmVkXCIgPyBjbGVhckltbWVkaWF0ZTogdW5kZWZpbmVkKSxcbiAgICBzZXRJbnRlcnZhbDogc2V0SW50ZXJ2YWwsXG4gICAgY2xlYXJJbnRlcnZhbDogY2xlYXJJbnRlcnZhbCxcbiAgICBEYXRlOiBEYXRlXG59O1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHNpbm9uO1xufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbigodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgJiYgZnVuY3Rpb24gKG0pIHtcbiAgICBkZWZpbmUoXCJmb3JtYXRpb1wiLCBbXCJzYW1zYW1cIl0sIG0pO1xufSkgfHwgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgZnVuY3Rpb24gKG0pIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG0ocmVxdWlyZShcInNhbXNhbVwiKSk7XG59KSB8fCBmdW5jdGlvbiAobSkgeyB0aGlzLmZvcm1hdGlvID0gbSh0aGlzLnNhbXNhbSk7IH1cbikoZnVuY3Rpb24gKHNhbXNhbSkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgdmFyIGZvcm1hdGlvID0ge1xuICAgICAgICBleGNsdWRlQ29uc3RydWN0b3JzOiBbXCJPYmplY3RcIiwgL14uJC9dLFxuICAgICAgICBxdW90ZVN0cmluZ3M6IHRydWVcbiAgICB9O1xuXG4gICAgdmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbiAgICB2YXIgc3BlY2lhbE9iamVjdHMgPSBbXTtcbiAgICBpZiAodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBzcGVjaWFsT2JqZWN0cy5wdXNoKHsgb2JqZWN0OiBnbG9iYWwsIHZhbHVlOiBcIltvYmplY3QgZ2xvYmFsXVwiIH0pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNwZWNpYWxPYmplY3RzLnB1c2goe1xuICAgICAgICAgICAgb2JqZWN0OiBkb2N1bWVudCxcbiAgICAgICAgICAgIHZhbHVlOiBcIltvYmplY3QgSFRNTERvY3VtZW50XVwiXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBzcGVjaWFsT2JqZWN0cy5wdXNoKHsgb2JqZWN0OiB3aW5kb3csIHZhbHVlOiBcIltvYmplY3QgV2luZG93XVwiIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZ1bmN0aW9uTmFtZShmdW5jKSB7XG4gICAgICAgIGlmICghZnVuYykgeyByZXR1cm4gXCJcIjsgfVxuICAgICAgICBpZiAoZnVuYy5kaXNwbGF5TmFtZSkgeyByZXR1cm4gZnVuYy5kaXNwbGF5TmFtZTsgfVxuICAgICAgICBpZiAoZnVuYy5uYW1lKSB7IHJldHVybiBmdW5jLm5hbWU7IH1cbiAgICAgICAgdmFyIG1hdGNoZXMgPSBmdW5jLnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uXFxzKyhbXlxcKF0rKS9tKTtcbiAgICAgICAgcmV0dXJuIChtYXRjaGVzICYmIG1hdGNoZXNbMV0pIHx8IFwiXCI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uc3RydWN0b3JOYW1lKGYsIG9iamVjdCkge1xuICAgICAgICB2YXIgbmFtZSA9IGZ1bmN0aW9uTmFtZShvYmplY3QgJiYgb2JqZWN0LmNvbnN0cnVjdG9yKTtcbiAgICAgICAgdmFyIGV4Y2x1ZGVzID0gZi5leGNsdWRlQ29uc3RydWN0b3JzIHx8XG4gICAgICAgICAgICAgICAgZm9ybWF0aW8uZXhjbHVkZUNvbnN0cnVjdG9ycyB8fCBbXTtcblxuICAgICAgICB2YXIgaSwgbDtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IGV4Y2x1ZGVzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleGNsdWRlc1tpXSA9PT0gXCJzdHJpbmdcIiAmJiBleGNsdWRlc1tpXSA9PT0gbmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChleGNsdWRlc1tpXS50ZXN0ICYmIGV4Y2x1ZGVzW2ldLnRlc3QobmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzQ2lyY3VsYXIob2JqZWN0LCBvYmplY3RzKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICB2YXIgaSwgbDtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IG9iamVjdHMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBpZiAob2JqZWN0c1tpXSA9PT0gb2JqZWN0KSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFzY2lpKGYsIG9iamVjdCwgcHJvY2Vzc2VkLCBpbmRlbnQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHZhciBxcyA9IGYucXVvdGVTdHJpbmdzO1xuICAgICAgICAgICAgdmFyIHF1b3RlID0gdHlwZW9mIHFzICE9PSBcImJvb2xlYW5cIiB8fCBxcztcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzZWQgfHwgcXVvdGUgPyAnXCInICsgb2JqZWN0ICsgJ1wiJyA6IG9iamVjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ID09PSBcImZ1bmN0aW9uXCIgJiYgIShvYmplY3QgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgICAgICByZXR1cm4gYXNjaWkuZnVuYyhvYmplY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvY2Vzc2VkID0gcHJvY2Vzc2VkIHx8IFtdO1xuXG4gICAgICAgIGlmIChpc0NpcmN1bGFyKG9iamVjdCwgcHJvY2Vzc2VkKSkgeyByZXR1cm4gXCJbQ2lyY3VsYXJdXCI7IH1cblxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgICAgICAgcmV0dXJuIGFzY2lpLmFycmF5LmNhbGwoZiwgb2JqZWN0LCBwcm9jZXNzZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvYmplY3QpIHsgcmV0dXJuIFN0cmluZygoMS9vYmplY3QpID09PSAtSW5maW5pdHkgPyBcIi0wXCIgOiBvYmplY3QpOyB9XG4gICAgICAgIGlmIChzYW1zYW0uaXNFbGVtZW50KG9iamVjdCkpIHsgcmV0dXJuIGFzY2lpLmVsZW1lbnQob2JqZWN0KTsgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0LnRvU3RyaW5nID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgICAgICAgICBvYmplY3QudG9TdHJpbmcgIT09IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3QudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpLCBsO1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gc3BlY2lhbE9iamVjdHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAob2JqZWN0ID09PSBzcGVjaWFsT2JqZWN0c1tpXS5vYmplY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3BlY2lhbE9iamVjdHNbaV0udmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXNjaWkub2JqZWN0LmNhbGwoZiwgb2JqZWN0LCBwcm9jZXNzZWQsIGluZGVudCk7XG4gICAgfVxuXG4gICAgYXNjaWkuZnVuYyA9IGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgICAgIHJldHVybiBcImZ1bmN0aW9uIFwiICsgZnVuY3Rpb25OYW1lKGZ1bmMpICsgXCIoKSB7fVwiO1xuICAgIH07XG5cbiAgICBhc2NpaS5hcnJheSA9IGZ1bmN0aW9uIChhcnJheSwgcHJvY2Vzc2VkKSB7XG4gICAgICAgIHByb2Nlc3NlZCA9IHByb2Nlc3NlZCB8fCBbXTtcbiAgICAgICAgcHJvY2Vzc2VkLnB1c2goYXJyYXkpO1xuICAgICAgICB2YXIgaSwgbCwgcGllY2VzID0gW107XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBhcnJheS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIHBpZWNlcy5wdXNoKGFzY2lpKHRoaXMsIGFycmF5W2ldLCBwcm9jZXNzZWQpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJbXCIgKyBwaWVjZXMuam9pbihcIiwgXCIpICsgXCJdXCI7XG4gICAgfTtcblxuICAgIGFzY2lpLm9iamVjdCA9IGZ1bmN0aW9uIChvYmplY3QsIHByb2Nlc3NlZCwgaW5kZW50KSB7XG4gICAgICAgIHByb2Nlc3NlZCA9IHByb2Nlc3NlZCB8fCBbXTtcbiAgICAgICAgcHJvY2Vzc2VkLnB1c2gob2JqZWN0KTtcbiAgICAgICAgaW5kZW50ID0gaW5kZW50IHx8IDA7XG4gICAgICAgIHZhciBwaWVjZXMgPSBbXSwgcHJvcGVydGllcyA9IHNhbXNhbS5rZXlzKG9iamVjdCkuc29ydCgpO1xuICAgICAgICB2YXIgbGVuZ3RoID0gMztcbiAgICAgICAgdmFyIHByb3AsIHN0ciwgb2JqLCBpLCBsO1xuXG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBwcm9wZXJ0aWVzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgcHJvcCA9IHByb3BlcnRpZXNbaV07XG4gICAgICAgICAgICBvYmogPSBvYmplY3RbcHJvcF07XG5cbiAgICAgICAgICAgIGlmIChpc0NpcmN1bGFyKG9iaiwgcHJvY2Vzc2VkKSkge1xuICAgICAgICAgICAgICAgIHN0ciA9IFwiW0NpcmN1bGFyXVwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHIgPSBhc2NpaSh0aGlzLCBvYmosIHByb2Nlc3NlZCwgaW5kZW50ICsgMik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0ciA9ICgvXFxzLy50ZXN0KHByb3ApID8gJ1wiJyArIHByb3AgKyAnXCInIDogcHJvcCkgKyBcIjogXCIgKyBzdHI7XG4gICAgICAgICAgICBsZW5ndGggKz0gc3RyLmxlbmd0aDtcbiAgICAgICAgICAgIHBpZWNlcy5wdXNoKHN0cik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY29ucyA9IGNvbnN0cnVjdG9yTmFtZSh0aGlzLCBvYmplY3QpO1xuICAgICAgICB2YXIgcHJlZml4ID0gY29ucyA/IFwiW1wiICsgY29ucyArIFwiXSBcIiA6IFwiXCI7XG4gICAgICAgIHZhciBpcyA9IFwiXCI7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBpbmRlbnQ7IGkgPCBsOyArK2kpIHsgaXMgKz0gXCIgXCI7IH1cblxuICAgICAgICBpZiAobGVuZ3RoICsgaW5kZW50ID4gODApIHtcbiAgICAgICAgICAgIHJldHVybiBwcmVmaXggKyBcIntcXG4gIFwiICsgaXMgKyBwaWVjZXMuam9pbihcIixcXG4gIFwiICsgaXMpICsgXCJcXG5cIiArXG4gICAgICAgICAgICAgICAgaXMgKyBcIn1cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJlZml4ICsgXCJ7IFwiICsgcGllY2VzLmpvaW4oXCIsIFwiKSArIFwiIH1cIjtcbiAgICB9O1xuXG4gICAgYXNjaWkuZWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIHZhciB0YWdOYW1lID0gZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBhdHRycyA9IGVsZW1lbnQuYXR0cmlidXRlcywgYXR0ciwgcGFpcnMgPSBbXSwgYXR0ck5hbWUsIGksIGwsIHZhbDtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsID0gYXR0cnMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBhdHRyID0gYXR0cnMuaXRlbShpKTtcbiAgICAgICAgICAgIGF0dHJOYW1lID0gYXR0ci5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoXCJodG1sOlwiLCBcIlwiKTtcbiAgICAgICAgICAgIHZhbCA9IGF0dHIubm9kZVZhbHVlO1xuICAgICAgICAgICAgaWYgKGF0dHJOYW1lICE9PSBcImNvbnRlbnRlZGl0YWJsZVwiIHx8IHZhbCAhPT0gXCJpbmhlcml0XCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoISF2YWwpIHsgcGFpcnMucHVzaChhdHRyTmFtZSArIFwiPVxcXCJcIiArIHZhbCArIFwiXFxcIlwiKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZvcm1hdHRlZCA9IFwiPFwiICsgdGFnTmFtZSArIChwYWlycy5sZW5ndGggPiAwID8gXCIgXCIgOiBcIlwiKTtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBlbGVtZW50LmlubmVySFRNTDtcblxuICAgICAgICBpZiAoY29udGVudC5sZW5ndGggPiAyMCkge1xuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQuc3Vic3RyKDAsIDIwKSArIFwiWy4uLl1cIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXMgPSBmb3JtYXR0ZWQgKyBwYWlycy5qb2luKFwiIFwiKSArIFwiPlwiICsgY29udGVudCArXG4gICAgICAgICAgICAgICAgXCI8L1wiICsgdGFnTmFtZSArIFwiPlwiO1xuXG4gICAgICAgIHJldHVybiByZXMucmVwbGFjZSgvIGNvbnRlbnRFZGl0YWJsZT1cImluaGVyaXRcIi8sIFwiXCIpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBGb3JtYXRpbyhvcHRpb25zKSB7XG4gICAgICAgIGZvciAodmFyIG9wdCBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzW29wdF0gPSBvcHRpb25zW29wdF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBGb3JtYXRpby5wcm90b3R5cGUgPSB7XG4gICAgICAgIGZ1bmN0aW9uTmFtZTogZnVuY3Rpb25OYW1lLFxuXG4gICAgICAgIGNvbmZpZ3VyZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRm9ybWF0aW8ob3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY29uc3RydWN0b3JOYW1lOiBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gY29uc3RydWN0b3JOYW1lKHRoaXMsIG9iamVjdCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXNjaWk6IGZ1bmN0aW9uIChvYmplY3QsIHByb2Nlc3NlZCwgaW5kZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gYXNjaWkodGhpcywgb2JqZWN0LCBwcm9jZXNzZWQsIGluZGVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIEZvcm1hdGlvLnByb3RvdHlwZTtcbn0pO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIigodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQgJiYgZnVuY3Rpb24gKG0pIHsgZGVmaW5lKFwic2Ftc2FtXCIsIG0pOyB9KSB8fFxuICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmXG4gICAgICBmdW5jdGlvbiAobSkgeyBtb2R1bGUuZXhwb3J0cyA9IG0oKTsgfSkgfHwgLy8gTm9kZVxuIGZ1bmN0aW9uIChtKSB7IHRoaXMuc2Ftc2FtID0gbSgpOyB9IC8vIEJyb3dzZXIgZ2xvYmFsc1xuKShmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG8gPSBPYmplY3QucHJvdG90eXBlO1xuICAgIHZhciBkaXYgPSB0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIgJiYgZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgIGZ1bmN0aW9uIGlzTmFOKHZhbHVlKSB7XG4gICAgICAgIC8vIFVubGlrZSBnbG9iYWwgaXNOYU4sIHRoaXMgYXZvaWRzIHR5cGUgY29lcmNpb25cbiAgICAgICAgLy8gdHlwZW9mIGNoZWNrIGF2b2lkcyBJRSBob3N0IG9iamVjdCBpc3N1ZXMsIGhhdCB0aXAgdG9cbiAgICAgICAgLy8gbG9kYXNoXG4gICAgICAgIHZhciB2YWwgPSB2YWx1ZTsgLy8gSnNMaW50IHRoaW5rcyB2YWx1ZSAhPT0gdmFsdWUgaXMgXCJ3ZWlyZFwiXG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgdmFsdWUgIT09IHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDbGFzcyh2YWx1ZSkge1xuICAgICAgICAvLyBSZXR1cm5zIHRoZSBpbnRlcm5hbCBbW0NsYXNzXV0gYnkgY2FsbGluZyBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG4gICAgICAgIC8vIHdpdGggdGhlIHByb3ZpZGVkIHZhbHVlIGFzIHRoaXMuIFJldHVybiB2YWx1ZSBpcyBhIHN0cmluZywgbmFtaW5nIHRoZVxuICAgICAgICAvLyBpbnRlcm5hbCBjbGFzcywgZS5nLiBcIkFycmF5XCJcbiAgICAgICAgcmV0dXJuIG8udG9TdHJpbmcuY2FsbCh2YWx1ZSkuc3BsaXQoL1sgXFxdXS8pWzFdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBuYW1lIHNhbXNhbS5pc0FyZ3VtZW50c1xuICAgICAqIEBwYXJhbSBPYmplY3Qgb2JqZWN0XG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGBgdHJ1ZWBgIGlmIGBgb2JqZWN0YGAgaXMgYW4gYGBhcmd1bWVudHNgYCBvYmplY3QsXG4gICAgICogYGBmYWxzZWBgIG90aGVyd2lzZS5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0FyZ3VtZW50cyhvYmplY3QpIHtcbiAgICAgICAgaWYgKGdldENsYXNzKG9iamVjdCkgPT09ICdBcmd1bWVudHMnKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBvYmplY3QubGVuZ3RoICE9PSBcIm51bWJlclwiIHx8XG4gICAgICAgICAgICAgICAgZ2V0Q2xhc3Mob2JqZWN0KSA9PT0gXCJBcnJheVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QuY2FsbGVlID09IFwiZnVuY3Rpb25cIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2JqZWN0W29iamVjdC5sZW5ndGhdID0gNjtcbiAgICAgICAgICAgIGRlbGV0ZSBvYmplY3Rbb2JqZWN0Lmxlbmd0aF07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBzYW1zYW0uaXNFbGVtZW50XG4gICAgICogQHBhcmFtIE9iamVjdCBvYmplY3RcbiAgICAgKlxuICAgICAqIFJldHVybnMgYGB0cnVlYGAgaWYgYGBvYmplY3RgYCBpcyBhIERPTSBlbGVtZW50IG5vZGUuIFVubGlrZVxuICAgICAqIFVuZGVyc2NvcmUuanMvbG9kYXNoLCB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGBgZmFsc2VgYCBpZiBgYG9iamVjdGBgXG4gICAgICogaXMgYW4gKmVsZW1lbnQtbGlrZSogb2JqZWN0LCBpLmUuIGEgcmVndWxhciBvYmplY3Qgd2l0aCBhIGBgbm9kZVR5cGVgYFxuICAgICAqIHByb3BlcnR5IHRoYXQgaG9sZHMgdGhlIHZhbHVlIGBgMWBgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRWxlbWVudChvYmplY3QpIHtcbiAgICAgICAgaWYgKCFvYmplY3QgfHwgb2JqZWN0Lm5vZGVUeXBlICE9PSAxIHx8ICFkaXYpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvYmplY3QuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgIG9iamVjdC5yZW1vdmVDaGlsZChkaXYpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG5hbWUgc2Ftc2FtLmtleXNcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iamVjdFxuICAgICAqXG4gICAgICogUmV0dXJuIGFuIGFycmF5IG9mIG93biBwcm9wZXJ0eSBuYW1lcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuICAgICAgICB2YXIga3MgPSBbXSwgcHJvcDtcbiAgICAgICAgZm9yIChwcm9wIGluIG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3ApKSB7IGtzLnB1c2gocHJvcCk7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG5hbWUgc2Ftc2FtLmlzRGF0ZVxuICAgICAqIEBwYXJhbSBPYmplY3QgdmFsdWVcbiAgICAgKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgb2JqZWN0IGlzIGEgYGBEYXRlYGAsIG9yICpkYXRlLWxpa2UqLiBEdWNrIHR5cGluZ1xuICAgICAqIG9mIGRhdGUgb2JqZWN0cyB3b3JrIGJ5IGNoZWNraW5nIHRoYXQgdGhlIG9iamVjdCBoYXMgYSBgYGdldFRpbWVgYFxuICAgICAqIGZ1bmN0aW9uIHdob3NlIHJldHVybiB2YWx1ZSBlcXVhbHMgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBvYmplY3Qnc1xuICAgICAqIGBgdmFsdWVPZmBgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRGF0ZSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlLmdldFRpbWUgPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICB2YWx1ZS5nZXRUaW1lKCkgPT0gdmFsdWUudmFsdWVPZigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBuYW1lIHNhbXNhbS5pc05lZ1plcm9cbiAgICAgKiBAcGFyYW0gT2JqZWN0IHZhbHVlXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGBgdHJ1ZWBgIGlmIGBgdmFsdWVgYCBpcyBgYC0wYGAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNOZWdaZXJvKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPT09IC1JbmZpbml0eTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBzYW1zYW0uZXF1YWxcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajFcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajJcbiAgICAgKlxuICAgICAqIFJldHVybnMgYGB0cnVlYGAgaWYgdHdvIG9iamVjdHMgYXJlIHN0cmljdGx5IGVxdWFsLiBDb21wYXJlZCB0b1xuICAgICAqIGBgPT09YGAgdGhlcmUgYXJlIHR3byBleGNlcHRpb25zOlxuICAgICAqXG4gICAgICogICAtIE5hTiBpcyBjb25zaWRlcmVkIGVxdWFsIHRvIE5hTlxuICAgICAqICAgLSAtMCBhbmQgKzAgYXJlIG5vdCBjb25zaWRlcmVkIGVxdWFsXG4gICAgICovXG4gICAgZnVuY3Rpb24gaWRlbnRpY2FsKG9iajEsIG9iajIpIHtcbiAgICAgICAgaWYgKG9iajEgPT09IG9iajIgfHwgKGlzTmFOKG9iajEpICYmIGlzTmFOKG9iajIpKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9iajEgIT09IDAgfHwgaXNOZWdaZXJvKG9iajEpID09PSBpc05lZ1plcm8ob2JqMik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBuYW1lIHNhbXNhbS5kZWVwRXF1YWxcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajFcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajJcbiAgICAgKlxuICAgICAqIERlZXAgZXF1YWwgY29tcGFyaXNvbi4gVHdvIHZhbHVlcyBhcmUgXCJkZWVwIGVxdWFsXCIgaWY6XG4gICAgICpcbiAgICAgKiAgIC0gVGhleSBhcmUgZXF1YWwsIGFjY29yZGluZyB0byBzYW1zYW0uaWRlbnRpY2FsXG4gICAgICogICAtIFRoZXkgYXJlIGJvdGggZGF0ZSBvYmplY3RzIHJlcHJlc2VudGluZyB0aGUgc2FtZSB0aW1lXG4gICAgICogICAtIFRoZXkgYXJlIGJvdGggYXJyYXlzIGNvbnRhaW5pbmcgZWxlbWVudHMgdGhhdCBhcmUgYWxsIGRlZXBFcXVhbFxuICAgICAqICAgLSBUaGV5IGFyZSBvYmplY3RzIHdpdGggdGhlIHNhbWUgc2V0IG9mIHByb3BlcnRpZXMsIGFuZCBlYWNoIHByb3BlcnR5XG4gICAgICogICAgIGluIGBgb2JqMWBgIGlzIGRlZXBFcXVhbCB0byB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBpbiBgYG9iajJgYFxuICAgICAqXG4gICAgICogU3VwcG9ydHMgY3ljbGljIG9iamVjdHMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZGVlcEVxdWFsQ3ljbGljKG9iajEsIG9iajIpIHtcblxuICAgICAgICAvLyB1c2VkIGZvciBjeWNsaWMgY29tcGFyaXNvblxuICAgICAgICAvLyBjb250YWluIGFscmVhZHkgdmlzaXRlZCBvYmplY3RzXG4gICAgICAgIHZhciBvYmplY3RzMSA9IFtdLFxuICAgICAgICAgICAgb2JqZWN0czIgPSBbXSxcbiAgICAgICAgLy8gY29udGFpbiBwYXRoZXMgKHBvc2l0aW9uIGluIHRoZSBvYmplY3Qgc3RydWN0dXJlKVxuICAgICAgICAvLyBvZiB0aGUgYWxyZWFkeSB2aXNpdGVkIG9iamVjdHNcbiAgICAgICAgLy8gaW5kZXhlcyBzYW1lIGFzIGluIG9iamVjdHMgYXJyYXlzXG4gICAgICAgICAgICBwYXRoczEgPSBbXSxcbiAgICAgICAgICAgIHBhdGhzMiA9IFtdLFxuICAgICAgICAvLyBjb250YWlucyBjb21iaW5hdGlvbnMgb2YgYWxyZWFkeSBjb21wYXJlZCBvYmplY3RzXG4gICAgICAgIC8vIGluIHRoZSBtYW5uZXI6IHsgXCIkMVsncmVmJ10kMlsncmVmJ11cIjogdHJ1ZSB9XG4gICAgICAgICAgICBjb21wYXJlZCA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB1c2VkIHRvIGNoZWNrLCBpZiB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpcyBhbiBvYmplY3RcbiAgICAgICAgICogKGN5Y2xpYyBsb2dpYyBpcyBvbmx5IG5lZWRlZCBmb3Igb2JqZWN0cylcbiAgICAgICAgICogb25seSBuZWVkZWQgZm9yIGN5Y2xpYyBsb2dpY1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgISh2YWx1ZSBpbnN0YW5jZW9mIEJvb2xlYW4pICYmXG4gICAgICAgICAgICAgICAgICAgICEodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSAgICAmJlxuICAgICAgICAgICAgICAgICAgICAhKHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyKSAgJiZcbiAgICAgICAgICAgICAgICAgICAgISh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkgICYmXG4gICAgICAgICAgICAgICAgICAgICEodmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcpKSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBnaXZlbiBvYmplY3QgaW4gdGhlXG4gICAgICAgICAqIGdpdmVuIG9iamVjdHMgYXJyYXksIC0xIGlmIG5vdCBjb250YWluZWRcbiAgICAgICAgICogb25seSBuZWVkZWQgZm9yIGN5Y2xpYyBsb2dpY1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0SW5kZXgob2JqZWN0cywgb2JqKSB7XG5cbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0c1tpXSA9PT0gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG9lcyB0aGUgcmVjdXJzaW9uIGZvciB0aGUgZGVlcCBlcXVhbCBjaGVja1xuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIGRlZXBFcXVhbChvYmoxLCBvYmoyLCBwYXRoMSwgcGF0aDIpIHtcbiAgICAgICAgICAgIHZhciB0eXBlMSA9IHR5cGVvZiBvYmoxO1xuICAgICAgICAgICAgdmFyIHR5cGUyID0gdHlwZW9mIG9iajI7XG5cbiAgICAgICAgICAgIC8vID09IG51bGwgYWxzbyBtYXRjaGVzIHVuZGVmaW5lZFxuICAgICAgICAgICAgaWYgKG9iajEgPT09IG9iajIgfHxcbiAgICAgICAgICAgICAgICAgICAgaXNOYU4ob2JqMSkgfHwgaXNOYU4ob2JqMikgfHxcbiAgICAgICAgICAgICAgICAgICAgb2JqMSA9PSBudWxsIHx8IG9iajIgPT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICAgICB0eXBlMSAhPT0gXCJvYmplY3RcIiB8fCB0eXBlMiAhPT0gXCJvYmplY3RcIikge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkZW50aWNhbChvYmoxLCBvYmoyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRWxlbWVudHMgYXJlIG9ubHkgZXF1YWwgaWYgaWRlbnRpY2FsKGV4cGVjdGVkLCBhY3R1YWwpXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KG9iajEpIHx8IGlzRWxlbWVudChvYmoyKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAgICAgdmFyIGlzRGF0ZTEgPSBpc0RhdGUob2JqMSksIGlzRGF0ZTIgPSBpc0RhdGUob2JqMik7XG4gICAgICAgICAgICBpZiAoaXNEYXRlMSB8fCBpc0RhdGUyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0RhdGUxIHx8ICFpc0RhdGUyIHx8IG9iajEuZ2V0VGltZSgpICE9PSBvYmoyLmdldFRpbWUoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBvYmoyIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iajEudG9TdHJpbmcoKSAhPT0gb2JqMi50b1N0cmluZygpKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY2xhc3MxID0gZ2V0Q2xhc3Mob2JqMSk7XG4gICAgICAgICAgICB2YXIgY2xhc3MyID0gZ2V0Q2xhc3Mob2JqMik7XG4gICAgICAgICAgICB2YXIga2V5czEgPSBrZXlzKG9iajEpO1xuICAgICAgICAgICAgdmFyIGtleXMyID0ga2V5cyhvYmoyKTtcblxuICAgICAgICAgICAgaWYgKGlzQXJndW1lbnRzKG9iajEpIHx8IGlzQXJndW1lbnRzKG9iajIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iajEubGVuZ3RoICE9PSBvYmoyLmxlbmd0aCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUxICE9PSB0eXBlMiB8fCBjbGFzczEgIT09IGNsYXNzMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5czEubGVuZ3RoICE9PSBrZXlzMi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGtleSwgaSwgbCxcbiAgICAgICAgICAgICAgICAvLyBmb2xsb3dpbmcgdmFycyBhcmUgdXNlZCBmb3IgdGhlIGN5Y2xpYyBsb2dpY1xuICAgICAgICAgICAgICAgIHZhbHVlMSwgdmFsdWUyLFxuICAgICAgICAgICAgICAgIGlzT2JqZWN0MSwgaXNPYmplY3QyLFxuICAgICAgICAgICAgICAgIGluZGV4MSwgaW5kZXgyLFxuICAgICAgICAgICAgICAgIG5ld1BhdGgxLCBuZXdQYXRoMjtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGtleXMxLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGtleSA9IGtleXMxW2ldO1xuICAgICAgICAgICAgICAgIGlmICghby5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iajIsIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFN0YXJ0IG9mIHRoZSBjeWNsaWMgbG9naWNcblxuICAgICAgICAgICAgICAgIHZhbHVlMSA9IG9iajFba2V5XTtcbiAgICAgICAgICAgICAgICB2YWx1ZTIgPSBvYmoyW2tleV07XG5cbiAgICAgICAgICAgICAgICBpc09iamVjdDEgPSBpc09iamVjdCh2YWx1ZTEpO1xuICAgICAgICAgICAgICAgIGlzT2JqZWN0MiA9IGlzT2JqZWN0KHZhbHVlMik7XG5cbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUsIGlmIHRoZSBvYmplY3RzIHdlcmUgYWxyZWFkeSB2aXNpdGVkXG4gICAgICAgICAgICAgICAgLy8gKGl0J3MgZmFzdGVyIHRvIGNoZWNrIGZvciBpc09iamVjdCBmaXJzdCwgdGhhbiB0b1xuICAgICAgICAgICAgICAgIC8vIGdldCAtMSBmcm9tIGdldEluZGV4IGZvciBub24gb2JqZWN0cylcbiAgICAgICAgICAgICAgICBpbmRleDEgPSBpc09iamVjdDEgPyBnZXRJbmRleChvYmplY3RzMSwgdmFsdWUxKSA6IC0xO1xuICAgICAgICAgICAgICAgIGluZGV4MiA9IGlzT2JqZWN0MiA/IGdldEluZGV4KG9iamVjdHMyLCB2YWx1ZTIpIDogLTE7XG5cbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUgdGhlIG5ldyBwYXRoZXMgb2YgdGhlIG9iamVjdHNcbiAgICAgICAgICAgICAgICAvLyAtIGZvciBub24gY3ljbGljIG9iamVjdHMgdGhlIGN1cnJlbnQgcGF0aCB3aWxsIGJlIGV4dGVuZGVkXG4gICAgICAgICAgICAgICAgLy8gICBieSBjdXJyZW50IHByb3BlcnR5IG5hbWVcbiAgICAgICAgICAgICAgICAvLyAtIGZvciBjeWNsaWMgb2JqZWN0cyB0aGUgc3RvcmVkIHBhdGggaXMgdGFrZW5cbiAgICAgICAgICAgICAgICBuZXdQYXRoMSA9IGluZGV4MSAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBwYXRoczFbaW5kZXgxXVxuICAgICAgICAgICAgICAgICAgICA6IHBhdGgxICsgJ1snICsgSlNPTi5zdHJpbmdpZnkoa2V5KSArICddJztcbiAgICAgICAgICAgICAgICBuZXdQYXRoMiA9IGluZGV4MiAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBwYXRoczJbaW5kZXgyXVxuICAgICAgICAgICAgICAgICAgICA6IHBhdGgyICsgJ1snICsgSlNPTi5zdHJpbmdpZnkoa2V5KSArICddJztcblxuICAgICAgICAgICAgICAgIC8vIHN0b3AgcmVjdXJzaW9uIGlmIGN1cnJlbnQgb2JqZWN0cyBhcmUgYWxyZWFkeSBjb21wYXJlZFxuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlZFtuZXdQYXRoMSArIG5ld1BhdGgyXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciB0aGUgY3VycmVudCBvYmplY3RzIGFuZCB0aGVpciBwYXRoZXNcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXgxID09PSAtMSAmJiBpc09iamVjdDEpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0czEucHVzaCh2YWx1ZTEpO1xuICAgICAgICAgICAgICAgICAgICBwYXRoczEucHVzaChuZXdQYXRoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmRleDIgPT09IC0xICYmIGlzT2JqZWN0Mikge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RzMi5wdXNoKHZhbHVlMik7XG4gICAgICAgICAgICAgICAgICAgIHBhdGhzMi5wdXNoKG5ld1BhdGgyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciB0aGF0IHRoZSBjdXJyZW50IG9iamVjdHMgYXJlIGFscmVhZHkgY29tcGFyZWRcbiAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QxICYmIGlzT2JqZWN0Mikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJlZFtuZXdQYXRoMSArIG5ld1BhdGgyXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRW5kIG9mIGN5Y2xpYyBsb2dpY1xuXG4gICAgICAgICAgICAgICAgLy8gbmVpdGhlciB2YWx1ZTEgbm9yIHZhbHVlMiBpcyBhIGN5Y2xlXG4gICAgICAgICAgICAgICAgLy8gY29udGludWUgd2l0aCBuZXh0IGxldmVsXG4gICAgICAgICAgICAgICAgaWYgKCFkZWVwRXF1YWwodmFsdWUxLCB2YWx1ZTIsIG5ld1BhdGgxLCBuZXdQYXRoMikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgfShvYmoxLCBvYmoyLCAnJDEnLCAnJDInKSk7XG4gICAgfVxuXG4gICAgdmFyIG1hdGNoO1xuXG4gICAgZnVuY3Rpb24gYXJyYXlDb250YWlucyhhcnJheSwgc3Vic2V0KSB7XG4gICAgICAgIGlmIChzdWJzZXQubGVuZ3RoID09PSAwKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIHZhciBpLCBsLCBqLCBrO1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gYXJyYXkubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goYXJyYXlbaV0sIHN1YnNldFswXSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gc3Vic2V0Lmxlbmd0aDsgaiA8IGs7ICsraikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKGFycmF5W2kgKyBqXSwgc3Vic2V0W2pdKSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBuYW1lIHNhbXNhbS5tYXRjaFxuICAgICAqIEBwYXJhbSBPYmplY3Qgb2JqZWN0XG4gICAgICogQHBhcmFtIE9iamVjdCBtYXRjaGVyXG4gICAgICpcbiAgICAgKiBDb21wYXJlIGFyYml0cmFyeSB2YWx1ZSBgYG9iamVjdGBgIHdpdGggbWF0Y2hlci5cbiAgICAgKi9cbiAgICBtYXRjaCA9IGZ1bmN0aW9uIG1hdGNoKG9iamVjdCwgbWF0Y2hlcikge1xuICAgICAgICBpZiAobWF0Y2hlciAmJiB0eXBlb2YgbWF0Y2hlci50ZXN0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVyLnRlc3Qob2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcihvYmplY3QpID09PSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBtYXRjaGVyID0gbWF0Y2hlci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIG5vdE51bGwgPSB0eXBlb2Ygb2JqZWN0ID09PSBcInN0cmluZ1wiIHx8ICEhb2JqZWN0O1xuICAgICAgICAgICAgcmV0dXJuIG5vdE51bGwgJiZcbiAgICAgICAgICAgICAgICAoU3RyaW5nKG9iamVjdCkpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihtYXRjaGVyKSA+PSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlciA9PT0gb2JqZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXIgPT09IG9iamVjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnZXRDbGFzcyhvYmplY3QpID09PSBcIkFycmF5XCIgJiYgZ2V0Q2xhc3MobWF0Y2hlcikgPT09IFwiQXJyYXlcIikge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5Q29udGFpbnMob2JqZWN0LCBtYXRjaGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtYXRjaGVyICYmIHR5cGVvZiBtYXRjaGVyID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB2YXIgcHJvcDtcbiAgICAgICAgICAgIGZvciAocHJvcCBpbiBtYXRjaGVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gb2JqZWN0W3Byb3BdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBvYmplY3QuZ2V0QXR0cmlidXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBvYmplY3QuZ2V0QXR0cmlidXRlKHByb3ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiIHx8ICFtYXRjaCh2YWx1ZSwgbWF0Y2hlcltwcm9wXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWF0Y2hlciB3YXMgbm90IGEgc3RyaW5nLCBhIG51bWJlciwgYSBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICBcImZ1bmN0aW9uLCBhIGJvb2xlYW4gb3IgYW4gb2JqZWN0XCIpO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpc0FyZ3VtZW50czogaXNBcmd1bWVudHMsXG4gICAgICAgIGlzRWxlbWVudDogaXNFbGVtZW50LFxuICAgICAgICBpc0RhdGU6IGlzRGF0ZSxcbiAgICAgICAgaXNOZWdaZXJvOiBpc05lZ1plcm8sXG4gICAgICAgIGlkZW50aWNhbDogaWRlbnRpY2FsLFxuICAgICAgICBkZWVwRXF1YWw6IGRlZXBFcXVhbEN5Y2xpYyxcbiAgICAgICAgbWF0Y2g6IG1hdGNoLFxuICAgICAgICBrZXlzOiBrZXlzXG4gICAgfTtcbn0pO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuKGZ1bmN0aW9uKHJvb3QpIHtcbiAgICB2YXIgdW5vcGluaW9uYXRlID0ge1xuICAgICAgICBzZWxlY3Rvcjogcm9vdC5qUXVlcnkgfHwgcm9vdC5aZXB0byB8fCByb290LmVuZGVyIHx8IHJvb3QuJCxcbiAgICAgICAgdGVtcGxhdGU6IHJvb3QuSGFuZGxlYmFycyB8fCByb290Lk11c3RhY2hlXG4gICAgfTtcblxuICAgIC8qKiogRXhwb3J0ICoqKi9cblxuICAgIC8vQU1EXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5vcGluaW9uYXRlO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy9Db21tb25KU1xuICAgIGVsc2UgaWYodHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHVub3BpbmlvbmF0ZTtcbiAgICB9XG4gICAgLy9HbG9iYWxcbiAgICBlbHNlIHtcbiAgICAgICAgcm9vdC51bm9waW5pb25hdGUgPSB1bm9waW5pb25hdGU7XG4gICAgfVxufSkodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbCk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwidmFyICQgPSByZXF1aXJlKCd1bm9waW5pb25hdGUnKS5zZWxlY3RvcixcbiAgICAgICAgc3BlY2lhbEtleXMgPSByZXF1aXJlKCcuL3NwZWNpYWxLZXlzJyk7XG5cbnZhciAkd2luZG93ID0gJCh3aW5kb3cpO1xuXG52YXIgRXZlbnQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgIHRoaXMuc2VsZWN0b3IgICA9IHNlbGVjdG9yO1xuICAgIHRoaXMuY2FsbGJhY2tzICA9IFtdO1xuICAgIHRoaXMuYWN0aXZlICAgICA9IHRydWU7XG59O1xuXG5FdmVudC5wcm90b3R5cGUgPSB7XG4gICAgdXA6IGZ1bmN0aW9uKGV2ZW50cykge1xuICAgICAgICB0aGlzLmJpbmQoJ3VwJywgZXZlbnRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBkb3duOiBmdW5jdGlvbihldmVudHMpIHtcbiAgICAgICAgdGhpcy5iaW5kKCdkb3duJywgZXZlbnRzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBiaW5kOiBmdW5jdGlvbih0eXBlLCBldmVudHMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChldmVudHMpKSB7XG4gICAgICAgICAgICAkLmVhY2goZXZlbnRzLCBmdW5jdGlvbihrZXksIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fYWRkKHR5cGUsIGtleSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hZGQodHlwZSwgZmFsc2UsIGV2ZW50cyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIG9mZjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgICR3aW5kb3dcbiAgICAgICAgICAgIC51bmJpbmQoJ2tleWRvd24nKVxuICAgICAgICAgICAgLnVuYmluZCgna2V5dXAnKTtcbiAgICB9LFxuXG4gICAgLyoqKiBJbnRlcm5hbCBGdW5jdGlvbnMgKioqL1xuICAgIF9hZGQ6IGZ1bmN0aW9uKHR5cGUsIGNvbmRpdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZighdGhpcy5jYWxsYmFja3NbdHlwZV0pIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzW3R5cGVdID0gW107XG5cbiAgICAgICAgICAgICR3aW5kb3cuYmluZCgna2V5JyArIHR5cGUsIHRoaXMuc2VsZWN0b3IsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBpZihzZWxmLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gc2VsZi5jYWxsYmFja3NbdHlwZV07XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpPTA7IGk8Y2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZighY2FsbGJhY2suY29uZGl0aW9ucyB8fCBzZWxmLl92YWxpZGF0ZShjYWxsYmFjay5jb25kaXRpb25zLCBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KHNlbGYsIFtlXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGNvbmRpdGlvbnMpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNvbmRpdGlvbnMgPSB0aGlzLl9wYXJzZUNvbmRpdGlvbnMoY29uZGl0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrc1t0eXBlXS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9LFxuICAgIF9wYXJzZUNvbmRpdGlvbnM6IGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgdmFyIGNvbmRpdGlvbnMgPSB7XG4gICAgICAgICAgICBzaGlmdDogICAvXFxic2hpZnRcXGIvaS50ZXN0KGMpLFxuICAgICAgICAgICAgYWx0OiAgICAgL1xcYihhbHR8YWx0ZXJuYXRlKVxcYi9pLnRlc3QoYyksXG4gICAgICAgICAgICBjdHJsOiAgICAvXFxiKGN0cmx8Y29udHJvbHxjbWR8Y29tbWFuZClcXGIvaS50ZXN0KGMpXG4gICAgICAgIH07XG5cbiAgICAgICAgLy9LZXkgQmluZGluZ1xuICAgICAgICB2YXIga2V5cyA9IGMubWF0Y2goL1xcYig/IXNoaWZ0fGFsdHxhbHRlcm5hdGV8Y3RybHxjb250cm9sfGNtZHxjb21tYW5kKShbYS16XFx1MDA2MFxcLT1cXFtcXF1cXFxcOycsXFwuXFwvXSspXFxiL2dpKTtcblxuICAgICAgICBpZigha2V5cykge1xuICAgICAgICAgICAgLy9Vc2UgbW9kaWZpZXIgYXMga2V5IGlmIHRoZXJlIGlzIG5vIG90aGVyIGtleVxuICAgICAgICAgICAga2V5cyA9IGMubWF0Y2goL1xcYihcXHcrKVxcYi9naSk7XG5cbiAgICAgICAgICAgIC8vTW9kaWZpZXJzIHNob3VsZCBhbGwgYmUgZmFsc2VcbiAgICAgICAgICAgIGNvbmRpdGlvbnMuc2hpZnQgPVxuICAgICAgICAgICAgY29uZGl0aW9ucy5hbHQgICA9XG4gICAgICAgICAgICBjb25kaXRpb25zLmN0cmwgID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihrZXlzKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLmtleSA9IGtleXNbMF07XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmKGtleXMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIk1vcmUgdGhhbiBvbmUga2V5IGJvdW5kIGluICdcIitjK1wiJy4gVXNpbmcgdGhlIGZpcnN0IG9uZSAoXCIra2V5c1swXStcIikuXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5rZXkgICAgICA9XG4gICAgICAgICAgICBjb25kaXRpb25zLmtleUNvZGUgID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb25kaXRpb25zO1xuICAgIH0sXG4gICAgX2tleUNvZGVUZXN0OiBmdW5jdGlvbihrZXksIGtleUNvZGUpIHtcbiAgICAgICAgaWYodHlwZW9mIHNwZWNpYWxLZXlzW2tleUNvZGVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdmFyIGtleURlZiA9IHNwZWNpYWxLZXlzW2tleUNvZGVdO1xuXG4gICAgICAgICAgICBpZihrZXlEZWYgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ga2V5RGVmLnRlc3Qoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXlEZWYgPT09IGtleS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoa2V5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIGtleS50b1VwcGVyQ2FzZSgpLmNoYXJDb2RlQXQoMCkgPT09IGtleUNvZGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIF92YWxpZGF0ZTogZnVuY3Rpb24oYywgZSkge1xuICAgICAgICByZXR1cm4gIChjLmtleSA/IHRoaXMuX2tleUNvZGVUZXN0KGMua2V5LCBlLndoaWNoKSA6IHRydWUpICYmXG4gICAgICAgICAgICAgICAgYy5zaGlmdCA9PT0gZS5zaGlmdEtleSAmJlxuICAgICAgICAgICAgICAgIGMuYWx0ICAgPT09IGUuYWx0S2V5ICYmXG4gICAgICAgICAgICAgICAgKCFjLmN0cmwgfHwgKGMuY3RybCA9PT0gZS5tZXRhS2V5KSAhPT0gKGMuY3RybCA9PT0gZS5jdHJsS2V5KSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudDtcblxuIiwidmFyIEV2ZW50ID0gcmVxdWlyZSgnLi9FdmVudC5qcycpLFxuICAgIGV2ZW50cyA9IFtdO1xuXG52YXIga2V5ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHsgLy9GYWN0b3J5IGZvciBFdmVudCBvYmplY3RzXG4gICAgcmV0dXJuIGtleS5fY3JlYXRlRXZlbnQoc2VsZWN0b3IpO1xufTtcblxua2V5LmRvd24gPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5fY3JlYXRlRXZlbnQoKS5kb3duKGNvbmZpZyk7XG59O1xuXG5rZXkudXAgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICByZXR1cm4gdGhpcy5fY3JlYXRlRXZlbnQoKS51cChjb25maWcpO1xufTtcblxua2V5LnVuYmluZEFsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHdoaWxlKGV2ZW50cy5sZW5ndGgpIHtcbiAgICAgICAgZXZlbnRzLnBvcCgpLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vQ3JlYXRlcyBuZXcgRXZlbnQgb2JqZWN0cyBhbmQgcHVzaGVzIHRoZW0gaW50byBldmVudHMgYXJyYXlcbmtleS5fY3JlYXRlRXZlbnQgPSBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgIHZhciBlID0gbmV3IEV2ZW50KHNlbGVjdG9yKTtcbiAgICBldmVudHMucHVzaChlKTtcbiAgICByZXR1cm4gZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ga2V5O1xuIiwiLy9BZG9wdGVkIGZyb20gW2pRdWVyeSBob3RrZXlzXShodHRwczovL2dpdGh1Yi5jb20vamVyZXNpZy9qcXVlcnkuaG90a2V5cy9ibG9iL21hc3Rlci9qcXVlcnkuaG90a2V5cy5qcylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgODogXCJiYWNrc3BhY2VcIixcbiAgICA5OiBcInRhYlwiLFxuICAgIDEwOiAvXihyZXR1cm58ZW50ZXIpJC9pLFxuICAgIDEzOiAvXihyZXR1cm58ZW50ZXIpJC9pLFxuICAgIDE2OiBcInNoaWZ0XCIsXG4gICAgMTc6IC9eKGN0cmx8Y29udHJvbCkkL2ksXG4gICAgMTg6IC9eKGFsdHxhbHRlcm5hdGUpJC9pLFxuICAgIDE5OiBcInBhdXNlXCIsXG4gICAgMjA6IFwiY2Fwc2xvY2tcIixcbiAgICAyNzogL14oZXNjfGVzY2FwZSkkL2ksXG4gICAgMzI6IFwic3BhY2VcIixcbiAgICAzMzogXCJwYWdldXBcIixcbiAgICAzNDogXCJwYWdlZG93blwiLFxuICAgIDM1OiBcImVuZFwiLFxuICAgIDM2OiBcImhvbWVcIixcbiAgICAzNzogXCJsZWZ0XCIsXG4gICAgMzg6IFwidXBcIixcbiAgICAzOTogXCJyaWdodFwiLFxuICAgIDQwOiBcImRvd25cIixcbiAgICA0NTogXCJpbnNlcnRcIixcbiAgICA0NjogL14oZGVsfGRlbGV0ZSkkL2ksXG4gICAgOTE6IC9eKGNtZHxjb21tYW5kKSQvaSxcbiAgICA5NjogXCIwXCIsXG4gICAgOTc6IFwiMVwiLFxuICAgIDk4OiBcIjJcIixcbiAgICA5OTogXCIzXCIsXG4gICAgMTAwOiBcIjRcIixcbiAgICAxMDE6IFwiNVwiLFxuICAgIDEwMjogXCI2XCIsXG4gICAgMTAzOiBcIjdcIixcbiAgICAxMDQ6IFwiOFwiLFxuICAgIDEwNTogXCI5XCIsXG4gICAgMTA2OiBcIipcIixcbiAgICAxMDc6IFwiK1wiLFxuICAgIDEwOTogXCItXCIsXG4gICAgMTEwOiBcIi5cIixcbiAgICAxMTEgOiBcIi9cIixcbiAgICAxMTI6IFwiZjFcIixcbiAgICAxMTM6IFwiZjJcIixcbiAgICAxMTQ6IFwiZjNcIixcbiAgICAxMTU6IFwiZjRcIixcbiAgICAxMTY6IFwiZjVcIixcbiAgICAxMTc6IFwiZjZcIixcbiAgICAxMTg6IFwiZjdcIixcbiAgICAxMTk6IFwiZjhcIixcbiAgICAxMjA6IFwiZjlcIixcbiAgICAxMjE6IFwiZjEwXCIsXG4gICAgMTIyOiBcImYxMVwiLFxuICAgIDEyMzogXCJmMTJcIixcbiAgICAxNDQ6IFwibnVtbG9ja1wiLFxuICAgIDE0NTogXCJzY3JvbGxcIixcbiAgICAxODY6IFwiO1wiLFxuICAgIDE4NzogXCI9XCIsXG4gICAgMTg5OiBcIi1cIixcbiAgICAxOTA6IFwiLlwiLFxuICAgIDE5MTogXCIvXCIsXG4gICAgMTkyOiBcImBcIixcbiAgICAyMTk6IFwiW1wiLFxuICAgIDIyMDogXCJcXFxcXCIsXG4gICAgMjIxOiBcIl1cIixcbiAgICAyMjI6IFwiJ1wiLFxuICAgIDIyNDogXCJtZXRhXCJcbn07XG4iLCJ2YXIgc2lub24gPSByZXF1aXJlKCdzaW5vbicpLFxuICAgIGtleSAgID0gcmVxdWlyZSgnLi4vc3JjL21haW4nKSxcbiAgICBtb2R1bGUgPSB3aW5kb3cubW9kdWxlLFxuICAgIHNhbmRib3gsXG4gICAgdGVzdENhbGxiYWNrO1xuXG4vKioqIEdMT0JBTCBLRVkgRVZFTlRTICoqKi9cblxubW9kdWxlKFwiZ2xvYmFsIGtleSBldmVudHNcIiwge1xuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2FuZGJveCAgICAgICAgID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgICAgICAgdGVzdENhbGxiYWNrICAgID0gc2lub24uc3B5KCk7XG4gICAgfSxcbiAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGtleS51bmJpbmRBbGwoKTtcbiAgICB9XG59KTtcblxudGVzdCgna2V5LmRvd24nLCBmdW5jdGlvbigpIHtcbiAgICBrZXkuZG93bih0ZXN0Q2FsbGJhY2spO1xuXG4gICAgJChkb2N1bWVudCkua2V5ZG93bigpO1xuICAgICQod2luZG93KS5rZXlkb3duKCk7XG5cbiAgICBkZWVwRXF1YWwodGVzdENhbGxiYWNrLmNhbGxDb3VudCwgMik7XG59KTtcblxudGVzdCgna2V5LnVwJywgZnVuY3Rpb24oKSB7XG4gICAga2V5LnVwKHRlc3RDYWxsYmFjayk7XG5cbiAgICAkKGRvY3VtZW50KS5rZXl1cCgpO1xuICAgICQod2luZG93KS5rZXl1cCgpO1xuXG4gICAgZGVlcEVxdWFsKHRlc3RDYWxsYmFjay5jYWxsQ291bnQsIDIpO1xufSk7XG5cbnRlc3QoJ2tleS51bmJpbmRBbGwnLCBmdW5jdGlvbigpIHtcbiAgICBrZXkuZG93bih0ZXN0Q2FsbGJhY2spO1xuICAgIGtleS51cCh0ZXN0Q2FsbGJhY2spO1xuICAgIGtleS51bmJpbmRBbGwoKTtcblxuICAgICQod2luZG93KS5rZXlkb3duKCkua2V5dXAoKTtcblxuICAgIG9rKCF0ZXN0Q2FsbGJhY2suY2FsbGVkKTtcbn0pO1xuXG5cbnRlc3QoJ2tleS5fY3JlYXRlRXZlbnQnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIga2V5ZXZlbnQxID0ga2V5LmRvd24odGVzdENhbGxiYWNrKSxcbiAgICAgICAga2V5ZXZlbnQyID0ga2V5LnVwKHRlc3RDYWxsYmFjayk7XG5cbiAgICBub3RFcXVhbChrZXlldmVudDEsIGtleWV2ZW50MiwgXCJHbG9iYWwga2V5IGV2ZW50cyBzaG91bGQgcmV0dXJuIGRpZmZlcmVudCBFdmVudCBvYmplY3RzXCIpO1xuXG4gICAga2V5ZG93bjEgPSBrZXkoJyNpbnB1dCcpO1xuICAgIGtleWRvd24yID0ga2V5KCcjaW5wdXQnKTtcblxuICAgIGRlZXBFcXVhbChrZXlldmVudDEsIGtleWV2ZW50MiwgXCJLZXkgZXZlbnRzIHdpdGggdGhlIHNhbWUgc2VsZWN0b3Igc2hvdWxkIHJldHVybiBkaWZmZXJlbnQgRXZlbnQgb2JqZWN0c1wiKTtcbn0pO1xuXG5cbi8qKiogRE9NIEVMRU1FTlQgS0VZIEVWRU5UUyAqKiovXG5cbnZhciAkaW5wdXQsXG4gICAga2V5RXZlbnQ7XG5cbm1vZHVsZShcIkRPTSBlbGVtZW50IGtleSBldmVudHNcIiwge1xuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2FuZGJveCAgICAgICAgID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgICAgICAgdGVzdENhbGxiYWNrICAgID0gc2lub24uc3B5KCk7XG4gICAgICAgICRpbnB1dCAgICAgICAgICA9ICQoXCIjaW5wdXRcIik7XG4gICAgICAgIGtleUV2ZW50ICAgICAgICA9IGtleSgkaW5wdXQpO1xuICAgIH0sXG4gICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICBrZXkudW5iaW5kQWxsKCk7XG4gICAgfVxufSk7XG5cbnRlc3QoJ2tleUV2ZW50LnVwJywgZnVuY3Rpb24oKSB7XG4gICAga2V5RXZlbnQudXAodGVzdENhbGxiYWNrKTtcblxuICAgICRpbnB1dC5rZXl1cCgpO1xuICAgIG9rKHRlc3RDYWxsYmFjay5jYWxsZWQpO1xufSk7XG5cbnRlc3QoJ2tleUV2ZW50LmRvd24nLCBmdW5jdGlvbigpIHtcbiAgICBrZXlFdmVudC5kb3duKHRlc3RDYWxsYmFjayk7XG4gICAgXG4gICAgJGlucHV0LmtleWRvd24oKTtcbiAgICBvayh0ZXN0Q2FsbGJhY2suY2FsbGVkKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5iaW5kJywgZnVuY3Rpb24oKSB7XG4gICAga2V5RXZlbnQuYmluZCgnZG93bicsIHRlc3RDYWxsYmFjayk7XG5cbiAgICAkaW5wdXQua2V5ZG93bigpO1xuICAgIG9rKHRlc3RDYWxsYmFjay5jYWxsZWQpO1xufSk7XG5cbnRlc3QoJ2tleUV2ZW50IG9mZi9vbicsIGZ1bmN0aW9uKCkge1xuICAgIGtleUV2ZW50XG4gICAgICAgIC5kb3duKHRlc3RDYWxsYmFjaylcbiAgICAgICAgLm9mZigpO1xuXG4gICAgJGlucHV0LmtleWRvd24oKTtcbiAgICBvayghdGVzdENhbGxiYWNrLmNhbGxlZCwgXCJPZmYgV29ya3NcIik7XG5cbiAgICBrZXlFdmVudC5vbigpO1xuICAgICRpbnB1dC5rZXlkb3duKCk7XG5cbiAgICBvayh0ZXN0Q2FsbGJhY2suY2FsbGVkLCBcIk9uIFdvcmtzXCIpO1xufSk7XG5cbnRlc3QoJ2tleUV2ZW50LmRlc3Ryb3knLCBmdW5jdGlvbigpIHtcbiAgICBrZXlFdmVudFxuICAgICAgICAuZG93bih0ZXN0Q2FsbGJhY2spXG4gICAgICAgIC5kZXN0cm95KCk7XG5cbiAgICAkaW5wdXQua2V5ZG93bigpO1xuICAgIG9rKCF0ZXN0Q2FsbGJhY2suY2FsbGVkLCBcIk5vIENhbGxiYWNrcyBGaXJlZFwiKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5fYWRkJywgZnVuY3Rpb24oKSB7XG4gICAga2V5RXZlbnQuX2FkZCgnZG93bicsIGZhbHNlLCB0ZXN0Q2FsbGJhY2spO1xuXG4gICAgJGlucHV0LmtleWRvd24oKTtcbiAgICBvayh0ZXN0Q2FsbGJhY2suY2FsbGVkLCBcIkFkZCB3aXRob3V0IGNvbmRpdGlvbnMgd29ya3MuXCIpO1xuXG5cbiAgICAvL29rKHRlc3RDYWxsYmFjay5jYWxsZWQsIFwiQWRkIHdpdGggY29uZGl0aW9ucyB3b3Jrcy5cIik7XG59KTtcblxuXG5cbi8qKiogS2V5IENvbmRpdGlvbiBUZXN0aW5nICoqKi9cblxubW9kdWxlKFwiS2V5IENvbmRpdGlvbnNcIiwge1xuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2FuZGJveCAgICAgICAgID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgICAgICAgdGVzdENhbGxiYWNrICAgID0gc2lub24uc3B5KCk7XG4gICAgICAgICRpbnB1dCAgICAgICAgICA9ICQoXCIjaW5wdXRcIik7XG4gICAgICAgIGtleUV2ZW50ICAgICAgICA9IGtleSgkaW5wdXQpO1xuICAgIH0sXG4gICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICBrZXkudW5iaW5kQWxsKCk7XG4gICAgfVxufSk7XG5cbnRlc3QoJ2tleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMgTW9kaWZpZXJzJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNvbmRpdGlvbnMgPSBrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zKCdzaGlmdCBhJyk7XG4gICAgb2soY29uZGl0aW9ucy5zaGlmdCwgXCJTaGlmdCBNb2RpZmllclwiKTtcbiAgICBcbiAgICBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnYWx0IGEnKTtcbiAgICBvayhjb25kaXRpb25zLmFsdCwgXCJBbHQgTW9kaWZpZXJcIik7XG5cbiAgICBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnY3RybCBhJyk7XG4gICAgb2soY29uZGl0aW9ucy5jdHJsLCBcIkN0cmwgTW9kaWZpZXJcIik7XG5cbiAgICBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnQUxUIGEnKTtcbiAgICBvayhjb25kaXRpb25zLmFsdCwgXCJVUFBFUkNBU0UgTW9kaWZpZXJzXCIpO1xuXG4gICAgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ2FsdCthJyk7XG4gICAgb2soY29uZGl0aW9ucy5hbHQsIFwiRGFzaCBTZXBhcmF0b3JzXCIpO1xuXG4gICAgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ2N0cmwgc2hpZnQgYWx0IGEnKTtcbiAgICBvayhjb25kaXRpb25zLmFsdCAmJiBjb25kaXRpb25zLnNoaWZ0ICYmIGNvbmRpdGlvbnMuY3RybCwgXCJNdWx0aXBsZSBtb2RpZmllcnMgd29ya1wiKTtcblxuICAgIGNvbmRpdGlvbnMgPSBrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zKCdjbWQgYScpO1xuICAgIG9rKGNvbmRpdGlvbnMuY3RybCwgXCJjbWQgYWxpYXNlcyBjdHJsXCIpO1xufSk7XG5cbnRlc3QoJ2tleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMga2V5cycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnYScpO1xuICAgIGVxdWFsKGNvbmRpdGlvbnMua2V5LCBcImFcIiwgXCJSZWNvZ25pemVzIG9uZSBjaGFyYWN0ZXIuXCIpO1xuXG4gICAgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ2JhY2tzcGFjZScpO1xuICAgIGVxdWFsKGNvbmRpdGlvbnMua2V5LCBcImJhY2tzcGFjZVwiLCBcIlJlY29nbml6ZXMgbG9uZ2VyIHdvcmRzLlwiKTtcblxuICAgIGNvbmRpdGlvbnMgPSBrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zKCdzaGlmdCBiYWNrc3BhY2UnKTtcbiAgICBlcXVhbChjb25kaXRpb25zLmtleSwgXCJiYWNrc3BhY2VcIiwgXCJJZ25vcmVzIG1vZGlmaWVycy5cIik7XG5cbiAgICBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnc2hpZnQnKTtcbiAgICBlcXVhbChjb25kaXRpb25zLmtleSwgXCJzaGlmdFwiLCBcIlVzZXMgbW9kaWZpZXIgYXMga2V5IGlmIG5vIG90aGVyIGtleSBpcyBwcm92aWRlZFwiKTtcblxuICAgIGNvbmRpdGlvbnMgPSBrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zKCcnKTtcbiAgICBvayghY29uZGl0aW9ucy5rZXkgJiYgIWNvbmRpdGlvbnMua2V5Q29kZSAmJiAhY29uZGl0aW9ucy5hbHQgJiYgIWNvbmRpdGlvbnMuc2hpZnQgJiYgIWNvbmRpdGlvbnMuY3RybCwgXCJFbXB0eSByZXR1cm5zIGFsbCBmYWxzZVwiKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5fa2V5Q29kZVRlc3QnLCBmdW5jdGlvbigpIHtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ2EnLCA2NSksIFwiU3RhbmRhcmQgbG93ZXJjYXNlIGxldHRlciBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdBJywgNjUpLCBcIlN0YW5kYXJkIHVwcGVyY2FzZSBsZXR0ZXIga2V5XCIpO1xuICAgIG9rKCFrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ0EnLCA2OCksIFwiV3JvbmcgbGV0dGVyIGtleVwiKTtcbiAgICBvaygha2V5RXZlbnQuX2tleUNvZGVUZXN0KCdhdm5hc2QnLCA2NSksIFwiVW5kZWZpbmVkIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ2N0cmwnLCAxNyksIFwiQ3RybCBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdjb250cm9sJywgMTcpLCBcImNvbW1hbmQga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnY21kJywgOTEpLCBcIkNtZCBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdjb21tYW5kJywgOTEpLCBcImNvbW1hbmQga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnNScsIDUzKSwgXCJOdW1iZXIga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnYCcsIDE5MiksIFwiYCBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdiYWNrc3BhY2UnLCA4KSwgXCJiYWNrc3BhY2Uga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnQkFDS1NQQUNFJywgOCksIFwiQkFDS1NQQUNFIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ2RlbGV0ZScsIDQ2KSwgXCJkZWxldGUga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnZW50ZXInLCAxMyksIFwiZW50ZXIga2V5ICgxMylcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdlbnRlcicsIDEwKSwgXCJlbnRlciBrZXkgKDEwKVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ3JldHVybicsIDEzKSwgXCJyZXR1cm4ga2V5ICgxMylcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdyZXR1cm4nLCAxMCksIFwicmV0dXJuIGtleSAoMTApXCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnLicsIDE5MCksIFwiLiBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KFwiJ1wiLCAyMjIpLCBcIicga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdChcIltcIiwgMjE5KSwgXCJbIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoXCJdXCIsIDIyMSksIFwiXSBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KFwiZjFcIiwgMTEyKSwgXCJmMSBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KFwiRjJcIiwgMTEzKSwgXCJGMiBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KFwiLVwiLCAxODkpLCBcIi0ga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdChcIj1cIiwgMTg3KSwgXCI9IGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoXCJlc2NcIiwgMjcpLCBcImVzYyBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KFwic3BhY2VcIiwgMzIpLCBcInNwYWNlIGtleVwiKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5fdmFsaWRhdGUnLCBmdW5jdGlvbigpIHtcbiAgICBvayhcbiAgICAgICAga2V5RXZlbnQuX3ZhbGlkYXRlKHtcbiAgICAgICAgICAgIGtleTogICAgICAgICdhJyxcbiAgICAgICAgICAgIHNoaWZ0OiAgICAgIGZhbHNlLFxuICAgICAgICAgICAgYWx0OiAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBjdHJsOiAgICAgICBmYWxzZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICB3aGljaDogICAgICA2NSxcbiAgICAgICAgICAgIHNoaWZ0S2V5OiAgIGZhbHNlLFxuICAgICAgICAgICAgYWx0S2V5OiAgICAgZmFsc2UsXG4gICAgICAgICAgICBtZXRhS2V5OiAgICBmYWxzZVxuICAgICAgICB9KSxcbiAgICAgICAgXCInYScga2V5XCJcbiAgICApO1xuXG4gICAgb2soXG4gICAgICAgICFrZXlFdmVudC5fdmFsaWRhdGUoe1xuICAgICAgICAgICAga2V5OiAgICAgICAgJ2EnLFxuICAgICAgICAgICAgc2hpZnQ6ICAgICAgZmFsc2UsXG4gICAgICAgICAgICBhbHQ6ICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIGN0cmw6ICAgICAgIGZhbHNlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHdoaWNoOiAgICAgIDY1LFxuICAgICAgICAgICAgc2hpZnRLZXk6ICAgdHJ1ZSxcbiAgICAgICAgICAgIGFsdEtleTogICAgIGZhbHNlLFxuICAgICAgICAgICAgbWV0YUtleTogICAgZmFsc2VcbiAgICAgICAgfSksXG4gICAgICAgIFwibm90ICdhJyBrZXlcIlxuICAgICk7XG5cbiAgICBvayhcbiAgICAgICAga2V5RXZlbnQuX3ZhbGlkYXRlKHtcbiAgICAgICAgICAgIGtleTogICAgICAgICdjbWQnLFxuICAgICAgICAgICAgc2hpZnQ6ICAgICAgZmFsc2UsXG4gICAgICAgICAgICBhbHQ6ICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIGN0cmw6ICAgICAgIGZhbHNlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHdoaWNoOiAgICAgIDkxLFxuICAgICAgICAgICAgc2hpZnRLZXk6ICAgZmFsc2UsXG4gICAgICAgICAgICBhbHRLZXk6ICAgICBmYWxzZSxcbiAgICAgICAgICAgIG1ldGFLZXk6ICAgIGZhbHNlXG4gICAgICAgIH0pLFxuICAgICAgICBcImNtZCBrZXlcIlxuICAgICk7XG5cbiAgICBvayhcbiAgICAgICAga2V5RXZlbnQuX3ZhbGlkYXRlKHtcbiAgICAgICAgICAgIGtleTogICAgICAgICdiJyxcbiAgICAgICAgICAgIHNoaWZ0OiAgICAgIHRydWUsXG4gICAgICAgICAgICBhbHQ6ICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgIGN0cmw6ICAgICAgIHRydWVcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgd2hpY2g6ICAgICAgNjYsXG4gICAgICAgICAgICBzaGlmdEtleTogICB0cnVlLFxuICAgICAgICAgICAgYWx0S2V5OiAgICAgZmFsc2UsXG4gICAgICAgICAgICBtZXRhS2V5OiAgICBmYWxzZSxcbiAgICAgICAgICAgIGN0cmxLZXk6ICAgIHRydWVcbiAgICAgICAgfSksXG4gICAgICAgIFwiY3RybCtzaGlmdCtiXCJcbiAgICApO1xuXG4gICAgb2soXG4gICAgICAgIGtleUV2ZW50Ll92YWxpZGF0ZSh7XG4gICAgICAgICAgICBrZXk6ICAgICAgICAnYicsXG4gICAgICAgICAgICBzaGlmdDogICAgICB0cnVlLFxuICAgICAgICAgICAgYWx0OiAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBjdHJsOiAgICAgICB0cnVlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHdoaWNoOiAgICAgIDY2LFxuICAgICAgICAgICAgc2hpZnRLZXk6ICAgdHJ1ZSxcbiAgICAgICAgICAgIGFsdEtleTogICAgIGZhbHNlLFxuICAgICAgICAgICAgbWV0YUtleTogICAgdHJ1ZSxcbiAgICAgICAgICAgIGN0cmxLZXk6ICAgIGZhbHNlXG4gICAgICAgIH0pLFxuICAgICAgICBcImNtZCtzaGlmdCtiXCJcbiAgICApO1xuXG4gICAgb2soXG4gICAgICAgIGtleUV2ZW50Ll92YWxpZGF0ZSh7XG4gICAgICAgICAgICBrZXk6ICAgICAgICAnLScsXG4gICAgICAgICAgICBzaGlmdDogICAgICB0cnVlLFxuICAgICAgICAgICAgYWx0OiAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBjdHJsOiAgICAgICB0cnVlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHdoaWNoOiAgICAgIDE4OSxcbiAgICAgICAgICAgIHNoaWZ0S2V5OiAgIHRydWUsXG4gICAgICAgICAgICBhbHRLZXk6ICAgICBmYWxzZSxcbiAgICAgICAgICAgIG1ldGFLZXk6ICAgIHRydWUsXG4gICAgICAgICAgICBjdHJsS2V5OiAgICBmYWxzZVxuICAgICAgICB9KSxcbiAgICAgICAgXCJjbWQgc2hpZnQgLSAoc3BlY2lhbCBrZXkpXCJcbiAgICApO1xuXG4gICAgb2soXG4gICAgICAgIGtleUV2ZW50Ll92YWxpZGF0ZSh7XG4gICAgICAgICAgICBrZXk6ICAgICAgICAnLycsXG4gICAgICAgICAgICBzaGlmdDogICAgICBmYWxzZSxcbiAgICAgICAgICAgIGFsdDogICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgY3RybDogICAgICAgdHJ1ZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICB3aGljaDogICAgICAxOTEsXG4gICAgICAgICAgICBzaGlmdEtleTogICBmYWxzZSxcbiAgICAgICAgICAgIGFsdEtleTogICAgIGZhbHNlLFxuICAgICAgICAgICAgbWV0YUtleTogICAgdHJ1ZSxcbiAgICAgICAgICAgIGN0cmxLZXk6ICAgIGZhbHNlXG4gICAgICAgIH0pLFxuICAgICAgICBcImNtZCsvIChhbm90aGVyIHNwZWNpYWwga2V5KVwiXG4gICAgKTtcblxufSk7XG5cblxuLyoqKiBDb25kaXRpb25hbCBLZXkgQmluZGluZ3MgKioqL1xudmFyIGU7XG5tb2R1bGUoXCJDb25kaXRpb25hbCBLZXkgQmluZGluZ3NcIiwge1xuICAgIHNldHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgc2FuZGJveCAgICAgICAgID0gc2lub24uc2FuZGJveC5jcmVhdGUoKTtcbiAgICAgICAgdGVzdENhbGxiYWNrICAgID0gc2lub24uc3B5KCk7XG4gICAgICAgICRpbnB1dCAgICAgICAgICA9ICQoXCIjaW5wdXRcIik7XG4gICAgICAgIGtleUV2ZW50ICAgICAgICA9IGtleSgkaW5wdXQpO1xuXG4gICAgICAgIGUgPSAkLkV2ZW50KCdrZXlkb3duJyk7XG4gICAgICAgIGUud2hpY2ggICAgPSBudWxsO1xuICAgICAgICBlLmN0cmxLZXkgID0gZmFsc2U7XG4gICAgICAgIGUuYWx0S2V5ICAgPSBmYWxzZTtcbiAgICAgICAgZS5tZXRhS2V5ICA9IGZhbHNlO1xuICAgICAgICBlLnNoaWZ0S2V5ID0gZmFsc2U7XG4gICAgfSxcbiAgICB0ZWFyZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIGtleS51bmJpbmRBbGwoKTtcbiAgICB9XG59KTtcblxudGVzdCgnZ2xvYmFsIGtleSBjb2RlJywgZnVuY3Rpb24oKSB7XG4gICAga2V5LmRvd24oe1xuICAgICAgICAnY3RybCthJzogdGVzdENhbGxiYWNrXG4gICAgfSk7XG5cbiAgICBlLndoaWNoICAgID0gNjU7XG4gICAgZS5jdHJsS2V5ICA9IHRydWU7XG5cbiAgICAkKHdpbmRvdykudHJpZ2dlcihlKTtcblxuICAgIG9rKHRlc3RDYWxsYmFjay5jYWxsZWQpO1xufSk7XG5cbnRlc3QoJ0RPTSBlbGVtZW50IGtleSBjb2RlJywgZnVuY3Rpb24oKSB7XG4gICAga2V5RXZlbnQuZG93bih7XG4gICAgICAgICdjdHJsK2EnOiB0ZXN0Q2FsbGJhY2tcbiAgICB9KTtcblxuICAgIGUud2hpY2ggICAgPSA2NTtcbiAgICBlLmN0cmxLZXkgID0gdHJ1ZTtcblxuICAgICRpbnB1dC50cmlnZ2VyKGUpO1xuXG4gICAgb2sodGVzdENhbGxiYWNrLmNhbGxlZCk7XG59KTtcblxudGVzdCgnZ2xvYmFsIGtleSBjb2RlIG5vIG1hdGNoJywgZnVuY3Rpb24oKSB7XG4gICAga2V5LmRvd24oe1xuICAgICAgICAnY3RybCtzaGlmdCthJzogdGVzdENhbGxiYWNrXG4gICAgfSk7XG5cbiAgICBlLndoaWNoICAgID0gNjU7XG4gICAgZS5jdHJsS2V5ICA9IHRydWU7XG5cbiAgICAkKHdpbmRvdykudHJpZ2dlcihlKTtcblxuICAgIG9rKCF0ZXN0Q2FsbGJhY2suY2FsbGVkKTtcbn0pO1xuXG50ZXN0KCdjbWQga2V5IG1hdGNoZXMgY3RybCBrZXknLCBmdW5jdGlvbigpIHtcbiAgICBrZXkuZG93bih7XG4gICAgICAgICdjbWQrc2hpZnQrYSc6IHRlc3RDYWxsYmFja1xuICAgIH0pO1xuXG4gICAgZS53aGljaCAgICA9IDY1O1xuICAgIGUuY3RybEtleSAgPSB0cnVlO1xuICAgIGUuc2hpZnRLZXkgPSB0cnVlO1xuXG4gICAgJCh3aW5kb3cpLnRyaWdnZXIoZSk7XG5cbiAgICBvayh0ZXN0Q2FsbGJhY2suY2FsbGVkKTtcbn0pO1xuXG50ZXN0KCdzaGlmdCBiaW5kaW5nJywgZnVuY3Rpb24oKSB7XG4gICAga2V5LmRvd24oe1xuICAgICAgICAnc2hpZnQnOiB0ZXN0Q2FsbGJhY2tcbiAgICB9KTtcblxuICAgIGUud2hpY2ggPSAxNjtcblxuICAgICQod2luZG93KS50cmlnZ2VyKGUpO1xuXG4gICAgb2sodGVzdENhbGxiYWNrLmNhbGxlZCk7XG59KTtcblxudGVzdCgndGhpcyBpbiBhIGNhbGxiYWNrIHNob3VsZCBiZSB0aGUga2V5IG9iamVjdCBpdHNlbGYnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZG93biA9IGtleS5kb3duKGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWVwRXF1YWwoZG93biwgdGhpcyk7XG4gICAgfSk7XG5cbiAgICAkKHdpbmRvdykudHJpZ2dlcihlKTtcbn0pO1xuXG4iXX0=
