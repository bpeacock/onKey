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

}).call(this,require("/Users/brianpeacock/apps/controllers/onKey/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"/Users/brianpeacock/apps/controllers/onKey/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":2,"inherits":1}],5:[function(require,module,exports){
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
}).call(this,require("/Users/brianpeacock/apps/controllers/onKey/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"../sinon":5,"/Users/brianpeacock/apps/controllers/onKey/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":2}],8:[function(require,module,exports){
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
                if (!match(object[prop], matcher[prop])) {
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
})(typeof window != 'undefined' ? window : this);

},{}],21:[function(require,module,exports){
var $ = require('unopinionate').selector,
        specialKeys = require('./specialKeys');

var $window = $(window);

var Event = function(selector) {
    this.selector   = selector;
    this.$scope     = selector ? $(selector) : $window;
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
        this.$scope
            .unbind('keydown')
            .unbind('keyup');
    },

    /*** Internal Functions ***/
    _add: function(type, conditions, callback) {
        var self = this;

        if(!this.callbacks[type]) {
            this.callbacks[type] = [];

            this.$scope.bind('key' + type, function(e) {
                if(self.active) {
                    var callbacks = self.callbacks[type];

                    for(var i=0; i<callbacks.length; i++) {
                        var callback = callbacks[i];
                        if(!callback.conditions || self._validate(callback.conditions, e)) {
                            callback(e);
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
        var keys = c.match(/\b(?!shift|alt|alternate|ctrl|control|cmd|command)(\w+)\b/gi);

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
            conditions.key      = null;
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

//Creates new Event objects (checking for existing first)
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

    conditions = keyEvent._parseConditions('alt-a');
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
        "ctrl-shift-b"
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
        "cmd-shift-b"
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
        'ctrl-a': testCallback
    });

    e.which    = 65;
    e.ctrlKey  = true;

    $(window).trigger(e);

    ok(testCallback.called);
});

test('DOM element key code', function() {
    keyEvent.down({
        'ctrl-a': testCallback
    });

    e.which    = 65;
    e.ctrlKey  = true;

    $input.trigger(e);

    ok(testCallback.called);
});

test('global key code no match', function() {
    key.down({
        'ctrl-shift-a': testCallback
    });

    e.which    = 65;
    e.ctrlKey  = true;

    $(window).trigger(e);

    ok(!testCallback.called);
});

test('cmd key matches ctrl key', function() {
    key.down({
        'cmd-shift-a': testCallback
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



},{"../src/main":22,"sinon":5}]},{},[24])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uLmpzIiwiL1VzZXJzL2JyaWFucGVhY29jay9hcHBzL2NvbnRyb2xsZXJzL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vYXNzZXJ0LmpzIiwiL1VzZXJzL2JyaWFucGVhY29jay9hcHBzL2NvbnRyb2xsZXJzL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vYmVoYXZpb3IuanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL2xpYi9zaW5vbi9jYWxsLmpzIiwiL1VzZXJzL2JyaWFucGVhY29jay9hcHBzL2NvbnRyb2xsZXJzL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vY29sbGVjdGlvbi5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL21hdGNoLmpzIiwiL1VzZXJzL2JyaWFucGVhY29jay9hcHBzL2NvbnRyb2xsZXJzL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vbW9jay5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL3NhbmRib3guanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL2xpYi9zaW5vbi9zcHkuanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL2xpYi9zaW5vbi9zdHViLmpzIiwiL1VzZXJzL2JyaWFucGVhY29jay9hcHBzL2NvbnRyb2xsZXJzL29uS2V5L25vZGVfbW9kdWxlcy9zaW5vbi9saWIvc2lub24vdGVzdC5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL3Rlc3RfY2FzZS5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvc2lub24vbGliL3Npbm9uL3V0aWwvZmFrZV90aW1lcnMuanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL25vZGVfbW9kdWxlcy9mb3JtYXRpby9saWIvZm9ybWF0aW8uanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL3Npbm9uL25vZGVfbW9kdWxlcy9mb3JtYXRpby9ub2RlX21vZHVsZXMvc2Ftc2FtL2xpYi9zYW1zYW0uanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL3Vub3BpbmlvbmF0ZS91bm9waW5pb25hdGUuanMiLCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvc3JjL0V2ZW50LmpzIiwiL1VzZXJzL2JyaWFucGVhY29jay9hcHBzL2NvbnRyb2xsZXJzL29uS2V5L3NyYy9tYWluLmpzIiwiL1VzZXJzL2JyaWFucGVhY29jay9hcHBzL2NvbnRyb2xsZXJzL29uS2V5L3NyYy9zcGVjaWFsS2V5cy5qcyIsIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS90ZXN0L3Rlc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbllBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsKXtcbi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIvVXNlcnMvYnJpYW5wZWFjb2NrL2FwcHMvY29udHJvbGxlcnMvb25LZXkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2luc2VydC1tb2R1bGUtZ2xvYmFscy9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIvKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlLCBmb3JpbjogdHJ1ZSwgbm9tZW46IGZhbHNlLCByZWdleHA6IGZhbHNlLCBwbHVzcGx1czogZmFsc2UqL1xuLypnbG9iYWwgbW9kdWxlLCByZXF1aXJlLCBfX2Rpcm5hbWUsIGRvY3VtZW50Ki9cbi8qKlxuICogU2lub24gY29yZSB1dGlsaXRpZXMuIEZvciBpbnRlcm5hbCB1c2Ugb25seS5cbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIHNpbm9uID0gKGZ1bmN0aW9uIChmb3JtYXRpbykge1xuICAgIHZhciBkaXYgPSB0eXBlb2YgZG9jdW1lbnQgIT0gXCJ1bmRlZmluZWRcIiAmJiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4gICAgZnVuY3Rpb24gaXNET01Ob2RlKG9iaikge1xuICAgICAgICB2YXIgc3VjY2VzcyA9IGZhbHNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvYmouYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgIHN1Y2Nlc3MgPSBkaXYucGFyZW50Tm9kZSA9PSBvYmo7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgb2JqLnJlbW92ZUNoaWxkKGRpdik7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIGZhaWxlZCwgbm90IG11Y2ggd2UgY2FuIGRvIGFib3V0IHRoYXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdWNjZXNzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRWxlbWVudChvYmopIHtcbiAgICAgICAgcmV0dXJuIGRpdiAmJiBvYmogJiYgb2JqLm5vZGVUeXBlID09PSAxICYmIGlzRE9NTm9kZShvYmopO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIgfHwgISEob2JqICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY2FsbCAmJiBvYmouYXBwbHkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pcnJvclByb3BlcnRpZXModGFyZ2V0LCBzb3VyY2UpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgIGlmICghaGFzT3duLmNhbGwodGFyZ2V0LCBwcm9wKSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzUmVzdG9yYWJsZSAob2JqKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIG9iai5yZXN0b3JlID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLnJlc3RvcmUuc2lub247XG4gICAgfVxuXG4gICAgdmFyIHNpbm9uID0ge1xuICAgICAgICB3cmFwTWV0aG9kOiBmdW5jdGlvbiB3cmFwTWV0aG9kKG9iamVjdCwgcHJvcGVydHksIG1ldGhvZCkge1xuICAgICAgICAgICAgaWYgKCFvYmplY3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU2hvdWxkIHdyYXAgcHJvcGVydHkgb2Ygb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZCAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTWV0aG9kIHdyYXBwZXIgc2hvdWxkIGJlIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgd3JhcHBlZE1ldGhvZCA9IG9iamVjdFtwcm9wZXJ0eV0sXG4gICAgICAgICAgICAgICAgZXJyb3I7XG5cbiAgICAgICAgICAgIGlmICghaXNGdW5jdGlvbih3cmFwcGVkTWV0aG9kKSkge1xuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IFR5cGVFcnJvcihcIkF0dGVtcHRlZCB0byB3cmFwIFwiICsgKHR5cGVvZiB3cmFwcGVkTWV0aG9kKSArIFwiIHByb3BlcnR5IFwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ICsgXCIgYXMgZnVuY3Rpb25cIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3cmFwcGVkTWV0aG9kLnJlc3RvcmUgJiYgd3JhcHBlZE1ldGhvZC5yZXN0b3JlLnNpbm9uKSB7XG4gICAgICAgICAgICAgICAgZXJyb3IgPSBuZXcgVHlwZUVycm9yKFwiQXR0ZW1wdGVkIHRvIHdyYXAgXCIgKyBwcm9wZXJ0eSArIFwiIHdoaWNoIGlzIGFscmVhZHkgd3JhcHBlZFwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHdyYXBwZWRNZXRob2QuY2FsbGVkQmVmb3JlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZlcmIgPSAhIXdyYXBwZWRNZXRob2QucmV0dXJucyA/IFwic3R1YmJlZFwiIDogXCJzcGllZCBvblwiO1xuICAgICAgICAgICAgICAgIGVycm9yID0gbmV3IFR5cGVFcnJvcihcIkF0dGVtcHRlZCB0byB3cmFwIFwiICsgcHJvcGVydHkgKyBcIiB3aGljaCBpcyBhbHJlYWR5IFwiICsgdmVyYik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGlmICh3cmFwcGVkTWV0aG9kLl9zdGFjaykge1xuICAgICAgICAgICAgICAgICAgICBlcnJvci5zdGFjayArPSAnXFxuLS0tLS0tLS0tLS0tLS1cXG4nICsgd3JhcHBlZE1ldGhvZC5fc3RhY2s7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJRSA4IGRvZXMgbm90IHN1cHBvcnQgaGFzT3duUHJvcGVydHkgb24gdGhlIHdpbmRvdyBvYmplY3QgYW5kIEZpcmVmb3ggaGFzIGEgcHJvYmxlbVxuICAgICAgICAgICAgLy8gd2hlbiB1c2luZyBoYXNPd24uY2FsbCBvbiBvYmplY3RzIGZyb20gb3RoZXIgZnJhbWVzLlxuICAgICAgICAgICAgdmFyIG93bmVkID0gb2JqZWN0Lmhhc093blByb3BlcnR5ID8gb2JqZWN0Lmhhc093blByb3BlcnR5KHByb3BlcnR5KSA6IGhhc093bi5jYWxsKG9iamVjdCwgcHJvcGVydHkpO1xuICAgICAgICAgICAgb2JqZWN0W3Byb3BlcnR5XSA9IG1ldGhvZDtcbiAgICAgICAgICAgIG1ldGhvZC5kaXNwbGF5TmFtZSA9IHByb3BlcnR5O1xuICAgICAgICAgICAgLy8gU2V0IHVwIGEgc3RhY2sgdHJhY2Ugd2hpY2ggY2FuIGJlIHVzZWQgbGF0ZXIgdG8gZmluZCB3aGF0IGxpbmUgb2ZcbiAgICAgICAgICAgIC8vIGNvZGUgdGhlIG9yaWdpbmFsIG1ldGhvZCB3YXMgY3JlYXRlZCBvbi5cbiAgICAgICAgICAgIG1ldGhvZC5fc3RhY2sgPSAobmV3IEVycm9yKCdTdGFjayBUcmFjZSBmb3Igb3JpZ2luYWwnKSkuc3RhY2s7XG5cbiAgICAgICAgICAgIG1ldGhvZC5yZXN0b3JlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIEZvciBwcm90b3R5cGUgcHJvcGVydGllcyB0cnkgdG8gcmVzZXQgYnkgZGVsZXRlIGZpcnN0LlxuICAgICAgICAgICAgICAgIC8vIElmIHRoaXMgZmFpbHMgKGV4OiBsb2NhbFN0b3JhZ2Ugb24gbW9iaWxlIHNhZmFyaSkgdGhlbiBmb3JjZSBhIHJlc2V0XG4gICAgICAgICAgICAgICAgLy8gdmlhIGRpcmVjdCBhc3NpZ25tZW50LlxuICAgICAgICAgICAgICAgIGlmICghb3duZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChvYmplY3RbcHJvcGVydHldID09PSBtZXRob2QpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0W3Byb3BlcnR5XSA9IHdyYXBwZWRNZXRob2Q7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbWV0aG9kLnJlc3RvcmUuc2lub24gPSB0cnVlO1xuICAgICAgICAgICAgbWlycm9yUHJvcGVydGllcyhtZXRob2QsIHdyYXBwZWRNZXRob2QpO1xuXG4gICAgICAgICAgICByZXR1cm4gbWV0aG9kO1xuICAgICAgICB9LFxuXG4gICAgICAgIGV4dGVuZDogZnVuY3Rpb24gZXh0ZW5kKHRhcmdldCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDEsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W3Byb3BdID0gYXJndW1lbnRzW2ldW3Byb3BdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gRE9OVCBFTlVNIGJ1Zywgb25seSBjYXJlIGFib3V0IHRvU3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoXCJ0b1N0cmluZ1wiKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzW2ldLnRvU3RyaW5nICE9IHRhcmdldC50b1N0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LnRvU3RyaW5nID0gYXJndW1lbnRzW2ldLnRvU3RyaW5nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKHByb3RvKSB7XG4gICAgICAgICAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBwcm90bztcbiAgICAgICAgICAgIHJldHVybiBuZXcgRigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlZXBFcXVhbDogZnVuY3Rpb24gZGVlcEVxdWFsKGEsIGIpIHtcbiAgICAgICAgICAgIGlmIChzaW5vbi5tYXRjaCAmJiBzaW5vbi5tYXRjaC5pc01hdGNoZXIoYSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYS50ZXN0KGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBhICE9IFwib2JqZWN0XCIgfHwgdHlwZW9mIGIgIT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KGEpIHx8IGlzRWxlbWVudChiKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhID09PSBiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYSA9PT0gYikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoKGEgPT09IG51bGwgJiYgYiAhPT0gbnVsbCkgfHwgKGEgIT09IG51bGwgJiYgYiA9PT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpO1xuICAgICAgICAgICAgaWYgKGFTdHJpbmcgIT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGIpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoYVN0cmluZyA9PSBcIltvYmplY3QgRGF0ZV1cIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwcm9wLCBhTGVuZ3RoID0gMCwgYkxlbmd0aCA9IDA7XG5cbiAgICAgICAgICAgIGlmIChhU3RyaW5nID09IFwiW29iamVjdCBBcnJheV1cIiAmJiBhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAocHJvcCBpbiBhKSB7XG4gICAgICAgICAgICAgICAgYUxlbmd0aCArPSAxO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFkZWVwRXF1YWwoYVtwcm9wXSwgYltwcm9wXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChwcm9wIGluIGIpIHtcbiAgICAgICAgICAgICAgICBiTGVuZ3RoICs9IDE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhTGVuZ3RoID09IGJMZW5ndGg7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZnVuY3Rpb25OYW1lOiBmdW5jdGlvbiBmdW5jdGlvbk5hbWUoZnVuYykge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBmdW5jLmRpc3BsYXlOYW1lIHx8IGZ1bmMubmFtZTtcblxuICAgICAgICAgICAgLy8gVXNlIGZ1bmN0aW9uIGRlY29tcG9zaXRpb24gYXMgYSBsYXN0IHJlc29ydCB0byBnZXQgZnVuY3Rpb25cbiAgICAgICAgICAgIC8vIG5hbWUuIERvZXMgbm90IHJlbHkgb24gZnVuY3Rpb24gZGVjb21wb3NpdGlvbiB0byB3b3JrIC0gaWYgaXRcbiAgICAgICAgICAgIC8vIGRvZXNuJ3QgZGVidWdnaW5nIHdpbGwgYmUgc2xpZ2h0bHkgbGVzcyBpbmZvcm1hdGl2ZVxuICAgICAgICAgICAgLy8gKGkuZS4gdG9TdHJpbmcgd2lsbCBzYXkgJ3NweScgcmF0aGVyIHRoYW4gJ215RnVuYycpLlxuICAgICAgICAgICAgaWYgKCFuYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoZXMgPSBmdW5jLnRvU3RyaW5nKCkubWF0Y2goL2Z1bmN0aW9uIChbXlxcc1xcKF0rKS8pO1xuICAgICAgICAgICAgICAgIG5hbWUgPSBtYXRjaGVzICYmIG1hdGNoZXNbMV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBuYW1lO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZ1bmN0aW9uVG9TdHJpbmc6IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q2FsbCAmJiB0aGlzLmNhbGxDb3VudCkge1xuICAgICAgICAgICAgICAgIHZhciB0aGlzVmFsdWUsIHByb3AsIGkgPSB0aGlzLmNhbGxDb3VudDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1ZhbHVlID0gdGhpcy5nZXRDYWxsKGkpLnRoaXNWYWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKHByb3AgaW4gdGhpc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpc1ZhbHVlW3Byb3BdID09PSB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlOYW1lIHx8IFwic2lub24gZmFrZVwiO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldENvbmZpZzogZnVuY3Rpb24gKGN1c3RvbSkge1xuICAgICAgICAgICAgdmFyIGNvbmZpZyA9IHt9O1xuICAgICAgICAgICAgY3VzdG9tID0gY3VzdG9tIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGRlZmF1bHRzID0gc2lub24uZGVmYXVsdENvbmZpZztcblxuICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBkZWZhdWx0cykge1xuICAgICAgICAgICAgICAgIGlmIChkZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWdbcHJvcF0gPSBjdXN0b20uaGFzT3duUHJvcGVydHkocHJvcCkgPyBjdXN0b21bcHJvcF0gOiBkZWZhdWx0c1twcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZm9ybWF0OiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIiArIHZhbDtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWZhdWx0Q29uZmlnOiB7XG4gICAgICAgICAgICBpbmplY3RJbnRvVGhpczogdHJ1ZSxcbiAgICAgICAgICAgIGluamVjdEludG86IG51bGwsXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXCJzcHlcIiwgXCJzdHViXCIsIFwibW9ja1wiLCBcImNsb2NrXCIsIFwic2VydmVyXCIsIFwicmVxdWVzdHNcIl0sXG4gICAgICAgICAgICB1c2VGYWtlVGltZXJzOiB0cnVlLFxuICAgICAgICAgICAgdXNlRmFrZVNlcnZlcjogdHJ1ZVxuICAgICAgICB9LFxuXG4gICAgICAgIHRpbWVzSW5Xb3JkczogZnVuY3Rpb24gdGltZXNJbldvcmRzKGNvdW50KSB7XG4gICAgICAgICAgICByZXR1cm4gY291bnQgPT0gMSAmJiBcIm9uY2VcIiB8fFxuICAgICAgICAgICAgICAgIGNvdW50ID09IDIgJiYgXCJ0d2ljZVwiIHx8XG4gICAgICAgICAgICAgICAgY291bnQgPT0gMyAmJiBcInRocmljZVwiIHx8XG4gICAgICAgICAgICAgICAgKGNvdW50IHx8IDApICsgXCIgdGltZXNcIjtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsZWRJbk9yZGVyOiBmdW5jdGlvbiAoc3BpZXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxLCBsID0gc3BpZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzcGllc1tpIC0gMV0uY2FsbGVkQmVmb3JlKHNwaWVzW2ldKSB8fCAhc3BpZXNbaV0uY2FsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9yZGVyQnlGaXJzdENhbGw6IGZ1bmN0aW9uIChzcGllcykge1xuICAgICAgICAgICAgcmV0dXJuIHNwaWVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICAvLyB1dWlkLCB3b24ndCBldmVyIGJlIGVxdWFsXG4gICAgICAgICAgICAgICAgdmFyIGFDYWxsID0gYS5nZXRDYWxsKDApO1xuICAgICAgICAgICAgICAgIHZhciBiQ2FsbCA9IGIuZ2V0Q2FsbCgwKTtcbiAgICAgICAgICAgICAgICB2YXIgYUlkID0gYUNhbGwgJiYgYUNhbGwuY2FsbElkIHx8IC0xO1xuICAgICAgICAgICAgICAgIHZhciBiSWQgPSBiQ2FsbCAmJiBiQ2FsbC5jYWxsSWQgfHwgLTE7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYUlkIDwgYklkID8gLTEgOiAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9nOiBmdW5jdGlvbiAoKSB7fSxcblxuICAgICAgICBsb2dFcnJvcjogZnVuY3Rpb24gKGxhYmVsLCBlcnIpIHtcbiAgICAgICAgICAgIHZhciBtc2cgPSBsYWJlbCArIFwiIHRocmV3IGV4Y2VwdGlvbjogXCI7XG4gICAgICAgICAgICBzaW5vbi5sb2cobXNnICsgXCJbXCIgKyBlcnIubmFtZSArIFwiXSBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmIChlcnIuc3RhY2spIHsgc2lub24ubG9nKGVyci5zdGFjayk7IH1cblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgZXJyLm1lc3NhZ2UgPSBtc2cgKyBlcnIubWVzc2FnZTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICB0eXBlT2Y6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcInVuZGVmaW5lZFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5nLnN1YnN0cmluZyg4LCBzdHJpbmcubGVuZ3RoIC0gMSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVTdHViSW5zdGFuY2U6IGZ1bmN0aW9uIChjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25zdHJ1Y3RvciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlRoZSBjb25zdHJ1Y3RvciBzaG91bGQgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2lub24uc3R1YihzaW5vbi5jcmVhdGUoY29uc3RydWN0b3IucHJvdG90eXBlKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVzdG9yZTogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUmVzdG9yYWJsZShvYmplY3RbcHJvcF0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbcHJvcF0ucmVzdG9yZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNSZXN0b3JhYmxlKG9iamVjdCkpIHtcbiAgICAgICAgICAgICAgICBvYmplY3QucmVzdG9yZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBpc05vZGUgPSB0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzO1xuICAgIHZhciBpc0FNRCA9IHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQ7XG5cbiAgICBpZiAoaXNBTUQpIHtcbiAgICAgICAgZGVmaW5lKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gc2lub247XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoaXNOb2RlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3JtYXRpbyA9IHJlcXVpcmUoXCJmb3JtYXRpb1wiKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzaW5vbjtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuc3B5ID0gcmVxdWlyZShcIi4vc2lub24vc3B5XCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5zcHlDYWxsID0gcmVxdWlyZShcIi4vc2lub24vY2FsbFwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuYmVoYXZpb3IgPSByZXF1aXJlKFwiLi9zaW5vbi9iZWhhdmlvclwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuc3R1YiA9IHJlcXVpcmUoXCIuL3Npbm9uL3N0dWJcIik7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLm1vY2sgPSByZXF1aXJlKFwiLi9zaW5vbi9tb2NrXCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5jb2xsZWN0aW9uID0gcmVxdWlyZShcIi4vc2lub24vY29sbGVjdGlvblwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMuYXNzZXJ0ID0gcmVxdWlyZShcIi4vc2lub24vYXNzZXJ0XCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5zYW5kYm94ID0gcmVxdWlyZShcIi4vc2lub24vc2FuZGJveFwiKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMudGVzdCA9IHJlcXVpcmUoXCIuL3Npbm9uL3Rlc3RcIik7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLnRlc3RDYXNlID0gcmVxdWlyZShcIi4vc2lub24vdGVzdF9jYXNlXCIpO1xuICAgICAgICBtb2R1bGUuZXhwb3J0cy5hc3NlcnQgPSByZXF1aXJlKFwiLi9zaW5vbi9hc3NlcnRcIik7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzLm1hdGNoID0gcmVxdWlyZShcIi4vc2lub24vbWF0Y2hcIik7XG4gICAgfVxuXG4gICAgaWYgKGZvcm1hdGlvKSB7XG4gICAgICAgIHZhciBmb3JtYXR0ZXIgPSBmb3JtYXRpby5jb25maWd1cmUoeyBxdW90ZVN0cmluZ3M6IGZhbHNlIH0pO1xuICAgICAgICBzaW5vbi5mb3JtYXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZm9ybWF0dGVyLmFzY2lpLmFwcGx5KGZvcm1hdHRlciwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGlzTm9kZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHV0aWwgPSByZXF1aXJlKFwidXRpbFwiKTtcbiAgICAgICAgICAgIHNpbm9uLmZvcm1hdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gXCJvYmplY3RcIiAmJiB2YWx1ZS50b1N0cmluZyA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyA/IHV0aWwuaW5zcGVjdCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8qIE5vZGUsIGJ1dCBubyB1dGlsIG1vZHVsZSAtIHdvdWxkIGJlIHZlcnkgb2xkLCBidXQgYmV0dGVyIHNhZmUgdGhhblxuICAgICAgICAgICAgIHNvcnJ5ICovXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2lub247XG59KHR5cGVvZiBmb3JtYXRpbyA9PSBcIm9iamVjdFwiICYmIGZvcm1hdGlvKSk7XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4vKipcbiAqIEBkZXBlbmQgLi4vc2lub24uanNcbiAqIEBkZXBlbmQgc3R1Yi5qc1xuICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlLCBub21lbjogZmFsc2UsIHBsdXNwbHVzOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICogQXNzZXJ0aW9ucyBtYXRjaGluZyB0aGUgdGVzdCBzcHkgcmV0cmlldmFsIGludGVyZmFjZS5cbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMC0yMDEzIENocmlzdGlhbiBKb2hhbnNlblxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuKGZ1bmN0aW9uIChzaW5vbiwgZ2xvYmFsKSB7XG4gICAgdmFyIGNvbW1vbkpTTW9kdWxlID0gdHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cztcbiAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgdmFyIGFzc2VydDtcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmVyaWZ5SXNTdHViKCkge1xuICAgICAgICB2YXIgbWV0aG9kO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgbWV0aG9kID0gYXJndW1lbnRzW2ldO1xuXG4gICAgICAgICAgICBpZiAoIW1ldGhvZCkge1xuICAgICAgICAgICAgICAgIGFzc2VydC5mYWlsKFwiZmFrZSBpcyBub3QgYSBzcHlcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWV0aG9kICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGFzc2VydC5mYWlsKG1ldGhvZCArIFwiIGlzIG5vdCBhIGZ1bmN0aW9uXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1ldGhvZC5nZXRDYWxsICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGFzc2VydC5mYWlsKG1ldGhvZCArIFwiIGlzIG5vdCBzdHViYmVkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmFpbEFzc2VydGlvbihvYmplY3QsIG1zZykge1xuICAgICAgICBvYmplY3QgPSBvYmplY3QgfHwgZ2xvYmFsO1xuICAgICAgICB2YXIgZmFpbE1ldGhvZCA9IG9iamVjdC5mYWlsIHx8IGFzc2VydC5mYWlsO1xuICAgICAgICBmYWlsTWV0aG9kLmNhbGwob2JqZWN0LCBtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1pcnJvclByb3BBc0Fzc2VydGlvbihuYW1lLCBtZXRob2QsIG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgbWVzc2FnZSA9IG1ldGhvZDtcbiAgICAgICAgICAgIG1ldGhvZCA9IG5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBhc3NlcnRbbmFtZV0gPSBmdW5jdGlvbiAoZmFrZSkge1xuICAgICAgICAgICAgdmVyaWZ5SXNTdHViKGZha2UpO1xuXG4gICAgICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgIHZhciBmYWlsZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXRob2QgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgZmFpbGVkID0gIW1ldGhvZChmYWtlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmFpbGVkID0gdHlwZW9mIGZha2VbbWV0aG9kXSA9PSBcImZ1bmN0aW9uXCIgP1xuICAgICAgICAgICAgICAgICAgICAhZmFrZVttZXRob2RdLmFwcGx5KGZha2UsIGFyZ3MpIDogIWZha2VbbWV0aG9kXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGZhaWxlZCkge1xuICAgICAgICAgICAgICAgIGZhaWxBc3NlcnRpb24odGhpcywgZmFrZS5wcmludGYuYXBwbHkoZmFrZSwgW21lc3NhZ2VdLmNvbmNhdChhcmdzKSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhc3NlcnQucGFzcyhuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBleHBvc2VkTmFtZShwcmVmaXgsIHByb3ApIHtcbiAgICAgICAgcmV0dXJuICFwcmVmaXggfHwgL15mYWlsLy50ZXN0KHByb3ApID8gcHJvcCA6XG4gICAgICAgICAgICBwcmVmaXggKyBwcm9wLnNsaWNlKDAsIDEpLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIGFzc2VydCA9IHtcbiAgICAgICAgZmFpbEV4Y2VwdGlvbjogXCJBc3NlcnRFcnJvclwiLFxuXG4gICAgICAgIGZhaWw6IGZ1bmN0aW9uIGZhaWwobWVzc2FnZSkge1xuICAgICAgICAgICAgdmFyIGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICAgICAgZXJyb3IubmFtZSA9IHRoaXMuZmFpbEV4Y2VwdGlvbiB8fCBhc3NlcnQuZmFpbEV4Y2VwdGlvbjtcblxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFzczogZnVuY3Rpb24gcGFzcyhhc3NlcnRpb24pIHt9LFxuXG4gICAgICAgIGNhbGxPcmRlcjogZnVuY3Rpb24gYXNzZXJ0Q2FsbE9yZGVyKCkge1xuICAgICAgICAgICAgdmVyaWZ5SXNTdHViLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB2YXIgZXhwZWN0ZWQgPSBcIlwiLCBhY3R1YWwgPSBcIlwiO1xuXG4gICAgICAgICAgICBpZiAoIXNpbm9uLmNhbGxlZEluT3JkZXIoYXJndW1lbnRzKSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkID0gW10uam9pbi5jYWxsKGFyZ3VtZW50cywgXCIsIFwiKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbGxzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaSA9IGNhbGxzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghY2FsbHNbLS1pXS5jYWxsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxscy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYWN0dWFsID0gc2lub24ub3JkZXJCeUZpcnN0Q2FsbChjYWxscykuam9pbihcIiwgXCIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhpcyBmYWlscywgd2UnbGwganVzdCBmYWxsIGJhY2sgdG8gdGhlIGJsYW5rIHN0cmluZ1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZhaWxBc3NlcnRpb24odGhpcywgXCJleHBlY3RlZCBcIiArIGV4cGVjdGVkICsgXCIgdG8gYmUgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJjYWxsZWQgaW4gb3JkZXIgYnV0IHdlcmUgY2FsbGVkIGFzIFwiICsgYWN0dWFsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYXNzZXJ0LnBhc3MoXCJjYWxsT3JkZXJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbENvdW50OiBmdW5jdGlvbiBhc3NlcnRDYWxsQ291bnQobWV0aG9kLCBjb3VudCkge1xuICAgICAgICAgICAgdmVyaWZ5SXNTdHViKG1ldGhvZCk7XG5cbiAgICAgICAgICAgIGlmIChtZXRob2QuY2FsbENvdW50ICE9IGNvdW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IFwiZXhwZWN0ZWQgJW4gdG8gYmUgY2FsbGVkIFwiICsgc2lub24udGltZXNJbldvcmRzKGNvdW50KSArXG4gICAgICAgICAgICAgICAgICAgIFwiIGJ1dCB3YXMgY2FsbGVkICVjJUNcIjtcbiAgICAgICAgICAgICAgICBmYWlsQXNzZXJ0aW9uKHRoaXMsIG1ldGhvZC5wcmludGYobXNnKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFzc2VydC5wYXNzKFwiY2FsbENvdW50XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGV4cG9zZTogZnVuY3Rpb24gZXhwb3NlKHRhcmdldCwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwidGFyZ2V0IGlzIG51bGwgb3IgdW5kZWZpbmVkXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgcHJlZml4ID0gdHlwZW9mIG8ucHJlZml4ID09IFwidW5kZWZpbmVkXCIgJiYgXCJhc3NlcnRcIiB8fCBvLnByZWZpeDtcbiAgICAgICAgICAgIHZhciBpbmNsdWRlRmFpbCA9IHR5cGVvZiBvLmluY2x1ZGVGYWlsID09IFwidW5kZWZpbmVkXCIgfHwgISFvLmluY2x1ZGVGYWlsO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBtZXRob2QgaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGlmIChtZXRob2QgIT0gXCJleHBvcnRcIiAmJiAoaW5jbHVkZUZhaWwgfHwgIS9eKGZhaWwpLy50ZXN0KG1ldGhvZCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldFtleHBvc2VkTmFtZShwcmVmaXgsIG1ldGhvZCldID0gdGhpc1ttZXRob2RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJjYWxsZWRcIiwgXCJleHBlY3RlZCAlbiB0byBoYXZlIGJlZW4gY2FsbGVkIGF0IGxlYXN0IG9uY2UgYnV0IHdhcyBuZXZlciBjYWxsZWRcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwibm90Q2FsbGVkXCIsIGZ1bmN0aW9uIChzcHkpIHsgcmV0dXJuICFzcHkuY2FsbGVkOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBcImV4cGVjdGVkICVuIHRvIG5vdCBoYXZlIGJlZW4gY2FsbGVkIGJ1dCB3YXMgY2FsbGVkICVjJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkT25jZVwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCBvbmNlIGJ1dCB3YXMgY2FsbGVkICVjJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkVHdpY2VcIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgdHdpY2UgYnV0IHdhcyBjYWxsZWQgJWMlQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJjYWxsZWRUaHJpY2VcIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgdGhyaWNlIGJ1dCB3YXMgY2FsbGVkICVjJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkT25cIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgd2l0aCAlMSBhcyB0aGlzIGJ1dCB3YXMgY2FsbGVkIHdpdGggJXRcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzQ2FsbGVkT25cIiwgXCJleHBlY3RlZCAlbiB0byBhbHdheXMgYmUgY2FsbGVkIHdpdGggJTEgYXMgdGhpcyBidXQgd2FzIGNhbGxlZCB3aXRoICV0XCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcImNhbGxlZFdpdGhOZXdcIiwgXCJleHBlY3RlZCAlbiB0byBiZSBjYWxsZWQgd2l0aCBuZXdcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzQ2FsbGVkV2l0aE5ld1wiLCBcImV4cGVjdGVkICVuIHRvIGFsd2F5cyBiZSBjYWxsZWQgd2l0aCBuZXdcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiY2FsbGVkV2l0aFwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCB3aXRoIGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcImNhbGxlZFdpdGhNYXRjaFwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCB3aXRoIG1hdGNoICUqJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzQ2FsbGVkV2l0aFwiLCBcImV4cGVjdGVkICVuIHRvIGFsd2F5cyBiZSBjYWxsZWQgd2l0aCBhcmd1bWVudHMgJSolQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJhbHdheXNDYWxsZWRXaXRoTWF0Y2hcIiwgXCJleHBlY3RlZCAlbiB0byBhbHdheXMgYmUgY2FsbGVkIHdpdGggbWF0Y2ggJSolQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJjYWxsZWRXaXRoRXhhY3RseVwiLCBcImV4cGVjdGVkICVuIHRvIGJlIGNhbGxlZCB3aXRoIGV4YWN0IGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcImFsd2F5c0NhbGxlZFdpdGhFeGFjdGx5XCIsIFwiZXhwZWN0ZWQgJW4gdG8gYWx3YXlzIGJlIGNhbGxlZCB3aXRoIGV4YWN0IGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcIm5ldmVyQ2FsbGVkV2l0aFwiLCBcImV4cGVjdGVkICVuIHRvIG5ldmVyIGJlIGNhbGxlZCB3aXRoIGFyZ3VtZW50cyAlKiVDXCIpO1xuICAgIG1pcnJvclByb3BBc0Fzc2VydGlvbihcIm5ldmVyQ2FsbGVkV2l0aE1hdGNoXCIsIFwiZXhwZWN0ZWQgJW4gdG8gbmV2ZXIgYmUgY2FsbGVkIHdpdGggbWF0Y2ggJSolQ1wiKTtcbiAgICBtaXJyb3JQcm9wQXNBc3NlcnRpb24oXCJ0aHJld1wiLCBcIiVuIGRpZCBub3QgdGhyb3cgZXhjZXB0aW9uJUNcIik7XG4gICAgbWlycm9yUHJvcEFzQXNzZXJ0aW9uKFwiYWx3YXlzVGhyZXdcIiwgXCIlbiBkaWQgbm90IGFsd2F5cyB0aHJvdyBleGNlcHRpb24lQ1wiKTtcblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzc2VydDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi5hc3NlcnQgPSBhc3NlcnQ7XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsLCB0eXBlb2Ygd2luZG93ICE9IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiAodHlwZW9mIHNlbGYgIT0gXCJ1bmRlZmluZWRcIikgPyBzZWxmIDogZ2xvYmFsKSk7XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pIiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qKlxuICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24sIHByb2Nlc3MsIHNldEltbWVkaWF0ZSwgc2V0VGltZW91dCovXG4vKipcbiAqIFN0dWIgYmVoYXZpb3JcbiAqXG4gKiBAYXV0aG9yIENocmlzdGlhbiBKb2hhbnNlbiAoY2hyaXN0aWFuQGNqb2hhbnNlbi5ubylcbiAqIEBhdXRob3IgVGltIEZpc2NoYmFjaCAobWFpbEB0aW1maXNjaGJhY2guZGUpXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuICAgIHZhciBqb2luID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG4gICAgdmFyIHByb3RvO1xuXG4gICAgdmFyIG5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLm5leHRUaWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIHNldEltbWVkaWF0ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAwKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgZnVuY3Rpb24gdGhyb3dzRXhjZXB0aW9uKGVycm9yLCBtZXNzYWdlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZXJyb3IgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5leGNlcHRpb24gPSBuZXcgRXJyb3IobWVzc2FnZSB8fCBcIlwiKTtcbiAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9uLm5hbWUgPSBlcnJvcjtcbiAgICAgICAgfSBlbHNlIGlmICghZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9uID0gbmV3IEVycm9yKFwiRXJyb3JcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV4Y2VwdGlvbiA9IGVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2FsbGJhY2soYmVoYXZpb3IsIGFyZ3MpIHtcbiAgICAgICAgdmFyIGNhbGxBcmdBdCA9IGJlaGF2aW9yLmNhbGxBcmdBdDtcblxuICAgICAgICBpZiAoY2FsbEFyZ0F0IDwgMCkge1xuICAgICAgICAgICAgdmFyIGNhbGxBcmdQcm9wID0gYmVoYXZpb3IuY2FsbEFyZ1Byb3A7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXJncy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNhbGxBcmdQcm9wICYmIHR5cGVvZiBhcmdzW2ldID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJnc1tpXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY2FsbEFyZ1Byb3AgJiYgYXJnc1tpXSAmJlxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgYXJnc1tpXVtjYWxsQXJnUHJvcF0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmdzW2ldW2NhbGxBcmdQcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFyZ3NbY2FsbEFyZ0F0XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDYWxsYmFja0Vycm9yKGJlaGF2aW9yLCBmdW5jLCBhcmdzKSB7XG4gICAgICAgIGlmIChiZWhhdmlvci5jYWxsQXJnQXQgPCAwKSB7XG4gICAgICAgICAgICB2YXIgbXNnO1xuXG4gICAgICAgICAgICBpZiAoYmVoYXZpb3IuY2FsbEFyZ1Byb3ApIHtcbiAgICAgICAgICAgICAgICBtc2cgPSBzaW5vbi5mdW5jdGlvbk5hbWUoYmVoYXZpb3Iuc3R1YikgK1xuICAgICAgICAgICAgICAgICAgICBcIiBleHBlY3RlZCB0byB5aWVsZCB0byAnXCIgKyBiZWhhdmlvci5jYWxsQXJnUHJvcCArXG4gICAgICAgICAgICAgICAgICAgIFwiJywgYnV0IG5vIG9iamVjdCB3aXRoIHN1Y2ggYSBwcm9wZXJ0eSB3YXMgcGFzc2VkLlwiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cgPSBzaW5vbi5mdW5jdGlvbk5hbWUoYmVoYXZpb3Iuc3R1YikgK1xuICAgICAgICAgICAgICAgICAgICBcIiBleHBlY3RlZCB0byB5aWVsZCwgYnV0IG5vIGNhbGxiYWNrIHdhcyBwYXNzZWQuXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBtc2cgKz0gXCIgUmVjZWl2ZWQgW1wiICsgam9pbi5jYWxsKGFyZ3MsIFwiLCBcIikgKyBcIl1cIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1zZztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBcImFyZ3VtZW50IGF0IGluZGV4IFwiICsgYmVoYXZpb3IuY2FsbEFyZ0F0ICsgXCIgaXMgbm90IGEgZnVuY3Rpb246IFwiICsgZnVuYztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxsQ2FsbGJhY2soYmVoYXZpb3IsIGFyZ3MpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBiZWhhdmlvci5jYWxsQXJnQXQgPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdmFyIGZ1bmMgPSBnZXRDYWxsYmFjayhiZWhhdmlvciwgYXJncyk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGdldENhbGxiYWNrRXJyb3IoYmVoYXZpb3IsIGZ1bmMsIGFyZ3MpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGJlaGF2aW9yLmNhbGxiYWNrQXN5bmMpIHtcbiAgICAgICAgICAgICAgICBuZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseShiZWhhdmlvci5jYWxsYmFja0NvbnRleHQsIGJlaGF2aW9yLmNhbGxiYWNrQXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnVuYy5hcHBseShiZWhhdmlvci5jYWxsYmFja0NvbnRleHQsIGJlaGF2aW9yLmNhbGxiYWNrQXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RvID0ge1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uKHN0dWIpIHtcbiAgICAgICAgICAgIHZhciBiZWhhdmlvciA9IHNpbm9uLmV4dGVuZCh7fSwgc2lub24uYmVoYXZpb3IpO1xuICAgICAgICAgICAgZGVsZXRlIGJlaGF2aW9yLmNyZWF0ZTtcbiAgICAgICAgICAgIGJlaGF2aW9yLnN0dWIgPSBzdHViO1xuXG4gICAgICAgICAgICByZXR1cm4gYmVoYXZpb3I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNQcmVzZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHRoaXMuY2FsbEFyZ0F0ID09ICdudW1iZXInIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9uIHx8XG4gICAgICAgICAgICAgICAgICAgIHR5cGVvZiB0aGlzLnJldHVybkFyZ0F0ID09ICdudW1iZXInIHx8XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuVGhpcyB8fFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlRGVmaW5lZCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52b2tlOiBmdW5jdGlvbihjb250ZXh0LCBhcmdzKSB7XG4gICAgICAgICAgICBjYWxsQ2FsbGJhY2sodGhpcywgYXJncyk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuZXhjZXB0aW9uO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcy5yZXR1cm5BcmdBdCA9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcmdzW3RoaXMucmV0dXJuQXJnQXRdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnJldHVyblRoaXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmV0dXJuVmFsdWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25DYWxsOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3R1Yi5vbkNhbGwoaW5kZXgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uRmlyc3RDYWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0dWIub25GaXJzdENhbGwoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblNlY29uZENhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3R1Yi5vblNlY29uZENhbGwoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblRoaXJkQ2FsbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdHViLm9uVGhpcmRDYWxsKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2l0aEFyZ3M6IGZ1bmN0aW9uKC8qIGFyZ3VtZW50cyAqLykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZWZpbmluZyBhIHN0dWIgYnkgaW52b2tpbmcgXCJzdHViLm9uQ2FsbCguLi4pLndpdGhBcmdzKC4uLilcIiBpcyBub3Qgc3VwcG9ydGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnVXNlIFwic3R1Yi53aXRoQXJncyguLi4pLm9uQ2FsbCguLi4pXCIgdG8gZGVmaW5lIHNlcXVlbnRpYWwgYmVoYXZpb3IgZm9yIGNhbGxzIHdpdGggY2VydGFpbiBhcmd1bWVudHMuJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbHNBcmc6IGZ1bmN0aW9uIGNhbGxzQXJnKHBvcykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb3MgIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBpbmRleCBpcyBub3QgbnVtYmVyXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IHBvcztcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnUHJvcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsc0FyZ09uOiBmdW5jdGlvbiBjYWxsc0FyZ09uKHBvcywgY29udGV4dCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb3MgIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBpbmRleCBpcyBub3QgbnVtYmVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgY29udGV4dCBpcyBub3QgYW4gb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IHBvcztcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ1Byb3AgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXN5bmMgPSBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbHNBcmdXaXRoOiBmdW5jdGlvbiBjYWxsc0FyZ1dpdGgocG9zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvcyAhPSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFyZ3VtZW50IGluZGV4IGlzIG5vdCBudW1iZXJcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ0F0ID0gcG9zO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FyZ3VtZW50cyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnUHJvcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsc0FyZ09uV2l0aDogZnVuY3Rpb24gY2FsbHNBcmdXaXRoKHBvcywgY29udGV4dCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwb3MgIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBpbmRleCBpcyBub3QgbnVtYmVyXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgY29udGV4dCBpcyBub3QgYW4gb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IHBvcztcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQ29udGV4dCA9IGNvbnRleHQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdQcm9wID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FzeW5jID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHlpZWxkczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnQXQgPSAtMTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBcmd1bWVudHMgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQ29udGV4dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ1Byb3AgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXN5bmMgPSBmYWxzZTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgeWllbGRzT246IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgIT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhcmd1bWVudCBjb250ZXh0IGlzIG5vdCBhbiBvYmplY3RcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ0F0ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJndW1lbnRzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0NvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICAgICAgdGhpcy5jYWxsQXJnUHJvcCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICB5aWVsZHNUbzogZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ0F0ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrQXJndW1lbnRzID0gc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0NvbnRleHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdQcm9wID0gcHJvcDtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBc3luYyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICB5aWVsZHNUb09uOiBmdW5jdGlvbiAocHJvcCwgY29udGV4dCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ICE9IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiYXJndW1lbnQgY29udGV4dCBpcyBub3QgYW4gb2JqZWN0XCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNhbGxBcmdBdCA9IC0xO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FyZ3VtZW50cyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tDb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ1Byb3AgPSBwcm9wO1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FzeW5jID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgXCJ0aHJvd3NcIjogdGhyb3dzRXhjZXB0aW9uLFxuICAgICAgICB0aHJvd3NFeGNlcHRpb246IHRocm93c0V4Y2VwdGlvbixcblxuICAgICAgICByZXR1cm5zOiBmdW5jdGlvbiByZXR1cm5zKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLnJldHVyblZhbHVlRGVmaW5lZCA9IHRydWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJldHVybnNBcmc6IGZ1bmN0aW9uIHJldHVybnNBcmcocG9zKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvcyAhPSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImFyZ3VtZW50IGluZGV4IGlzIG5vdCBudW1iZXJcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucmV0dXJuQXJnQXQgPSBwb3M7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJldHVybnNUaGlzOiBmdW5jdGlvbiByZXR1cm5zVGhpcygpIHtcbiAgICAgICAgICAgIHRoaXMucmV0dXJuVGhpcyA9IHRydWU7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGNyZWF0ZSBhc3luY2hyb25vdXMgdmVyc2lvbnMgb2YgY2FsbHNBcmcqIGFuZCB5aWVsZHMqIG1ldGhvZHNcbiAgICBmb3IgKHZhciBtZXRob2QgaW4gcHJvdG8pIHtcbiAgICAgICAgLy8gbmVlZCB0byBhdm9pZCBjcmVhdGluZyBhbm90aGVyYXN5bmMgdmVyc2lvbnMgb2YgdGhlIG5ld2x5IGFkZGVkIGFzeW5jIG1ldGhvZHNcbiAgICAgICAgaWYgKHByb3RvLmhhc093blByb3BlcnR5KG1ldGhvZCkgJiZcbiAgICAgICAgICAgIG1ldGhvZC5tYXRjaCgvXihjYWxsc0FyZ3x5aWVsZHMpLykgJiZcbiAgICAgICAgICAgICFtZXRob2QubWF0Y2goL0FzeW5jLykpIHtcbiAgICAgICAgICAgIHByb3RvW21ldGhvZCArICdBc3luYyddID0gKGZ1bmN0aW9uIChzeW5jRm5OYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXNbc3luY0ZuTmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FzeW5jID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkobWV0aG9kKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHByb3RvO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbm9uLmJlaGF2aW9yID0gcHJvdG87XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsKSk7XG59KS5jYWxsKHRoaXMscmVxdWlyZShcIi9Vc2Vycy9icmlhbnBlYWNvY2svYXBwcy9jb250cm9sbGVycy9vbktleS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5zZXJ0LW1vZHVsZS1nbG9iYWxzL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanNcIikpIiwiLyoqXG4gICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICAqIEBkZXBlbmQgbWF0Y2guanNcbiAgKi9cbi8qanNsaW50IGVxZXFlcTogZmFsc2UsIG9uZXZhcjogZmFsc2UsIHBsdXNwbHVzOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICAqIFNweSBjYWxsc1xuICAqXG4gICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gICogQGF1dGhvciBNYXhpbWlsaWFuIEFudG9uaSAobWFpbEBtYXhhbnRvbmkuZGUpXG4gICogQGxpY2Vuc2UgQlNEXG4gICpcbiAgKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAgKiBDb3B5cmlnaHQgKGMpIDIwMTMgTWF4aW1pbGlhbiBBbnRvbmlcbiAgKi9cblwidXNlIHN0cmljdFwiO1xuXG4oZnVuY3Rpb24gKHNpbm9uKSB7XG4gICAgdmFyIGNvbW1vbkpTTW9kdWxlID0gdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHM7XG4gICAgaWYgKCFzaW5vbiAmJiBjb21tb25KU01vZHVsZSkge1xuICAgICAgICBzaW5vbiA9IHJlcXVpcmUoXCIuLi9zaW5vblwiKTtcbiAgICB9XG5cbiAgICBpZiAoIXNpbm9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aHJvd1lpZWxkRXJyb3IocHJveHksIHRleHQsIGFyZ3MpIHtcbiAgICAgICAgdmFyIG1zZyA9IHNpbm9uLmZ1bmN0aW9uTmFtZShwcm94eSkgKyB0ZXh0O1xuICAgICAgICBpZiAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1zZyArPSBcIiBSZWNlaXZlZCBbXCIgKyBzbGljZS5jYWxsKGFyZ3MpLmpvaW4oXCIsIFwiKSArIFwiXVwiO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgIH1cblxuICAgIHZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICAgIHZhciBjYWxsUHJvdG8gPSB7XG4gICAgICAgIGNhbGxlZE9uOiBmdW5jdGlvbiBjYWxsZWRPbih0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChzaW5vbi5tYXRjaCAmJiBzaW5vbi5tYXRjaC5pc01hdGNoZXIodGhpc1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzVmFsdWUudGVzdCh0aGlzLnRoaXNWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50aGlzVmFsdWUgPT09IHRoaXNWYWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsZWRXaXRoOiBmdW5jdGlvbiBjYWxsZWRXaXRoKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFzaW5vbi5kZWVwRXF1YWwoYXJndW1lbnRzW2ldLCB0aGlzLmFyZ3NbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGxlZFdpdGhNYXRjaDogZnVuY3Rpb24gY2FsbGVkV2l0aE1hdGNoKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFjdHVhbCA9IHRoaXMuYXJnc1tpXTtcbiAgICAgICAgICAgICAgICB2YXIgZXhwZWN0YXRpb24gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKCFzaW5vbi5tYXRjaCB8fCAhc2lub24ubWF0Y2goZXhwZWN0YXRpb24pLnRlc3QoYWN0dWFsKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGVkV2l0aEV4YWN0bHk6IGZ1bmN0aW9uIGNhbGxlZFdpdGhFeGFjdGx5KCkge1xuICAgICAgICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT0gdGhpcy5hcmdzLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGVkV2l0aC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG5vdENhbGxlZFdpdGg6IGZ1bmN0aW9uIG5vdENhbGxlZFdpdGgoKSB7XG4gICAgICAgICAgICByZXR1cm4gIXRoaXMuY2FsbGVkV2l0aC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG5vdENhbGxlZFdpdGhNYXRjaDogZnVuY3Rpb24gbm90Q2FsbGVkV2l0aE1hdGNoKCkge1xuICAgICAgICAgICAgcmV0dXJuICF0aGlzLmNhbGxlZFdpdGhNYXRjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJldHVybmVkOiBmdW5jdGlvbiByZXR1cm5lZCh2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHNpbm9uLmRlZXBFcXVhbCh2YWx1ZSwgdGhpcy5yZXR1cm5WYWx1ZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdGhyZXc6IGZ1bmN0aW9uIHRocmV3KGVycm9yKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGVycm9yID09PSBcInVuZGVmaW5lZFwiIHx8ICF0aGlzLmV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiAhIXRoaXMuZXhjZXB0aW9uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5leGNlcHRpb24gPT09IGVycm9yIHx8IHRoaXMuZXhjZXB0aW9uLm5hbWUgPT09IGVycm9yO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGxlZFdpdGhOZXc6IGZ1bmN0aW9uIGNhbGxlZFdpdGhOZXcoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcm94eS5wcm90b3R5cGUgJiYgdGhpcy50aGlzVmFsdWUgaW5zdGFuY2VvZiB0aGlzLnByb3h5O1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGxlZEJlZm9yZTogZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jYWxsSWQgPCBvdGhlci5jYWxsSWQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGVkQWZ0ZXI6IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbElkID4gb3RoZXIuY2FsbElkO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbGxBcmc6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgICAgICAgIHRoaXMuYXJnc1twb3NdKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbEFyZ09uOiBmdW5jdGlvbiAocG9zLCB0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXJnc1twb3NdLmFwcGx5KHRoaXNWYWx1ZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbEFyZ1dpdGg6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbEFyZ09uV2l0aC5hcHBseSh0aGlzLCBbcG9zLCBudWxsXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbEFyZ09uV2l0aDogZnVuY3Rpb24gKHBvcywgdGhpc1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcbiAgICAgICAgICAgIHRoaXMuYXJnc1twb3NdLmFwcGx5KHRoaXNWYWx1ZSwgYXJncyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgXCJ5aWVsZFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnlpZWxkT24uYXBwbHkodGhpcywgW251bGxdLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTtcbiAgICAgICAgfSxcblxuICAgICAgICB5aWVsZE9uOiBmdW5jdGlvbiAodGhpc1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHRoaXMuYXJncztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXJncy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3NbaV0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW2ldLmFwcGx5KHRoaXNWYWx1ZSwgc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRocm93WWllbGRFcnJvcih0aGlzLnByb3h5LCBcIiBjYW5ub3QgeWllbGQgc2luY2Ugbm8gY2FsbGJhY2sgd2FzIHBhc3NlZC5cIiwgYXJncyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgeWllbGRUbzogZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgICAgICAgIHRoaXMueWllbGRUb09uLmFwcGx5KHRoaXMsIFtwcm9wLCBudWxsXS5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgeWllbGRUb09uOiBmdW5jdGlvbiAocHJvcCwgdGhpc1ZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHRoaXMuYXJncztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gYXJncy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJnc1tpXSAmJiB0eXBlb2YgYXJnc1tpXVtwcm9wXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbaV1bcHJvcF0uYXBwbHkodGhpc1ZhbHVlLCBzbGljZS5jYWxsKGFyZ3VtZW50cywgMikpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3dZaWVsZEVycm9yKHRoaXMucHJveHksIFwiIGNhbm5vdCB5aWVsZCB0byAnXCIgKyBwcm9wICtcbiAgICAgICAgICAgICAgICBcIicgc2luY2Ugbm8gY2FsbGJhY2sgd2FzIHBhc3NlZC5cIiwgYXJncyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjYWxsU3RyID0gdGhpcy5wcm94eS50b1N0cmluZygpICsgXCIoXCI7XG4gICAgICAgICAgICB2YXIgYXJncyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuYXJncy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goc2lub24uZm9ybWF0KHRoaXMuYXJnc1tpXSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjYWxsU3RyID0gY2FsbFN0ciArIGFyZ3Muam9pbihcIiwgXCIpICsgXCIpXCI7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5yZXR1cm5WYWx1ZSAhPSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgY2FsbFN0ciArPSBcIiA9PiBcIiArIHNpbm9uLmZvcm1hdCh0aGlzLnJldHVyblZhbHVlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FsbFN0ciArPSBcIiAhXCIgKyB0aGlzLmV4Y2VwdGlvbi5uYW1lO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZXhjZXB0aW9uLm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbFN0ciArPSBcIihcIiArIHRoaXMuZXhjZXB0aW9uLm1lc3NhZ2UgKyBcIilcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYWxsU3RyO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNhbGxQcm90by5pbnZva2VDYWxsYmFjayA9IGNhbGxQcm90by55aWVsZDtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVNweUNhbGwoc3B5LCB0aGlzVmFsdWUsIGFyZ3MsIHJldHVyblZhbHVlLCBleGNlcHRpb24sIGlkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaWQgIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYWxsIGlkIGlzIG5vdCBhIG51bWJlclwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcHJveHlDYWxsID0gc2lub24uY3JlYXRlKGNhbGxQcm90byk7XG4gICAgICAgIHByb3h5Q2FsbC5wcm94eSA9IHNweTtcbiAgICAgICAgcHJveHlDYWxsLnRoaXNWYWx1ZSA9IHRoaXNWYWx1ZTtcbiAgICAgICAgcHJveHlDYWxsLmFyZ3MgPSBhcmdzO1xuICAgICAgICBwcm94eUNhbGwucmV0dXJuVmFsdWUgPSByZXR1cm5WYWx1ZTtcbiAgICAgICAgcHJveHlDYWxsLmV4Y2VwdGlvbiA9IGV4Y2VwdGlvbjtcbiAgICAgICAgcHJveHlDYWxsLmNhbGxJZCA9IGlkO1xuXG4gICAgICAgIHJldHVybiBwcm94eUNhbGw7XG4gICAgfVxuICAgIGNyZWF0ZVNweUNhbGwudG9TdHJpbmcgPSBjYWxsUHJvdG8udG9TdHJpbmc7IC8vIHVzZWQgYnkgbW9ja3NcblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVNweUNhbGw7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2lub24uc3B5Q2FsbCA9IGNyZWF0ZVNweUNhbGw7XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsKSk7XG5cbiIsIi8qKlxuICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICogQGRlcGVuZCBzdHViLmpzXG4gKiBAZGVwZW5kIG1vY2suanNcbiAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgZm9yaW46IHRydWUqL1xuLypnbG9iYWwgbW9kdWxlLCByZXF1aXJlLCBzaW5vbiovXG4vKipcbiAqIENvbGxlY3Rpb25zIG9mIHN0dWJzLCBzcGllcyBhbmQgbW9ja3MuXG4gKlxuICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcbiAgICB2YXIgcHVzaCA9IFtdLnB1c2g7XG4gICAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RmFrZXMoZmFrZUNvbGxlY3Rpb24pIHtcbiAgICAgICAgaWYgKCFmYWtlQ29sbGVjdGlvbi5mYWtlcykge1xuICAgICAgICAgICAgZmFrZUNvbGxlY3Rpb24uZmFrZXMgPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWtlQ29sbGVjdGlvbi5mYWtlcztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlYWNoKGZha2VDb2xsZWN0aW9uLCBtZXRob2QpIHtcbiAgICAgICAgdmFyIGZha2VzID0gZ2V0RmFrZXMoZmFrZUNvbGxlY3Rpb24pO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gZmFrZXMubGVuZ3RoOyBpIDwgbDsgaSArPSAxKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZha2VzW2ldW21ldGhvZF0gPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgZmFrZXNbaV1bbWV0aG9kXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29tcGFjdChmYWtlQ29sbGVjdGlvbikge1xuICAgICAgICB2YXIgZmFrZXMgPSBnZXRGYWtlcyhmYWtlQ29sbGVjdGlvbik7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBmYWtlcy5sZW5ndGgpIHtcbiAgICAgICAgICBmYWtlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgY29sbGVjdGlvbiA9IHtcbiAgICAgICAgdmVyaWZ5OiBmdW5jdGlvbiByZXNvbHZlKCkge1xuICAgICAgICAgICAgZWFjaCh0aGlzLCBcInZlcmlmeVwiKTtcbiAgICAgICAgfSxcblxuICAgICAgICByZXN0b3JlOiBmdW5jdGlvbiByZXN0b3JlKCkge1xuICAgICAgICAgICAgZWFjaCh0aGlzLCBcInJlc3RvcmVcIik7XG4gICAgICAgICAgICBjb21wYWN0KHRoaXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZlcmlmeUFuZFJlc3RvcmU6IGZ1bmN0aW9uIHZlcmlmeUFuZFJlc3RvcmUoKSB7XG4gICAgICAgICAgICB2YXIgZXhjZXB0aW9uO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5KCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZXN0b3JlKCk7XG5cbiAgICAgICAgICAgIGlmIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBleGNlcHRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkOiBmdW5jdGlvbiBhZGQoZmFrZSkge1xuICAgICAgICAgICAgcHVzaC5jYWxsKGdldEZha2VzKHRoaXMpLCBmYWtlKTtcbiAgICAgICAgICAgIHJldHVybiBmYWtlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNweTogZnVuY3Rpb24gc3B5KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHNpbm9uLnNweS5hcHBseShzaW5vbiwgYXJndW1lbnRzKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3R1YjogZnVuY3Rpb24gc3R1YihvYmplY3QsIHByb3BlcnR5LCB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgdmFyIG9yaWdpbmFsID0gb2JqZWN0W3Byb3BlcnR5XTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb3JpZ2luYWwgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBzdHViIG5vbi1leGlzdGVudCBvd24gcHJvcGVydHkgXCIgKyBwcm9wZXJ0eSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBvYmplY3RbcHJvcGVydHldID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3RvcmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3RbcHJvcGVydHldID0gb3JpZ2luYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghcHJvcGVydHkgJiYgISFvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0dWJiZWRPYmogPSBzaW5vbi5zdHViLmFwcGx5KHNpbm9uLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBzdHViYmVkT2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R1YmJlZE9ialtwcm9wXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZChzdHViYmVkT2JqW3Byb3BdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBzdHViYmVkT2JqO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoc2lub24uc3R1Yi5hcHBseShzaW5vbiwgYXJndW1lbnRzKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbW9jazogZnVuY3Rpb24gbW9jaygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZChzaW5vbi5tb2NrLmFwcGx5KHNpbm9uLCBhcmd1bWVudHMpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbmplY3Q6IGZ1bmN0aW9uIGluamVjdChvYmopIHtcbiAgICAgICAgICAgIHZhciBjb2wgPSB0aGlzO1xuXG4gICAgICAgICAgICBvYmouc3B5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2wuc3B5LmFwcGx5KGNvbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIG9iai5zdHViID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2wuc3R1Yi5hcHBseShjb2wsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvYmoubW9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sLm1vY2suYXBwbHkoY29sLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIG9iajtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAoY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBjb2xsZWN0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpbm9uLmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uO1xuICAgIH1cbn0odHlwZW9mIHNpbm9uID09IFwib2JqZWN0XCIgJiYgc2lub24gfHwgbnVsbCkpO1xuIiwiLyogQGRlcGVuZCAuLi9zaW5vbi5qcyAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgcGx1c3BsdXM6IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24qL1xuLyoqXG4gKiBNYXRjaCBmdW5jdGlvbnNcbiAqXG4gKiBAYXV0aG9yIE1heGltaWxpYW4gQW50b25pIChtYWlsQG1heGFudG9uaS5kZSlcbiAqIEBsaWNlbnNlIEJTRFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMiBNYXhpbWlsaWFuIEFudG9uaVxuICovXG5cInVzZSBzdHJpY3RcIjtcblxuKGZ1bmN0aW9uIChzaW5vbikge1xuICAgIHZhciBjb21tb25KU01vZHVsZSA9IHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzO1xuXG4gICAgaWYgKCFzaW5vbiAmJiBjb21tb25KU01vZHVsZSkge1xuICAgICAgICBzaW5vbiA9IHJlcXVpcmUoXCIuLi9zaW5vblwiKTtcbiAgICB9XG5cbiAgICBpZiAoIXNpbm9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhc3NlcnRUeXBlKHZhbHVlLCB0eXBlLCBuYW1lKSB7XG4gICAgICAgIHZhciBhY3R1YWwgPSBzaW5vbi50eXBlT2YodmFsdWUpO1xuICAgICAgICBpZiAoYWN0dWFsICE9PSB0eXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRXhwZWN0ZWQgdHlwZSBvZiBcIiArIG5hbWUgKyBcIiB0byBiZSBcIiArXG4gICAgICAgICAgICAgICAgdHlwZSArIFwiLCBidXQgd2FzIFwiICsgYWN0dWFsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBtYXRjaGVyID0ge1xuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWVzc2FnZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBpc01hdGNoZXIob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBtYXRjaGVyLmlzUHJvdG90eXBlT2Yob2JqZWN0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYXRjaE9iamVjdChleHBlY3RhdGlvbiwgYWN0dWFsKSB7XG4gICAgICAgIGlmIChhY3R1YWwgPT09IG51bGwgfHwgYWN0dWFsID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICAgIGlmIChleHBlY3RhdGlvbi5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV4cCA9IGV4cGVjdGF0aW9uW2tleV07XG4gICAgICAgICAgICAgICAgdmFyIGFjdCA9IGFjdHVhbFtrZXldO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaC5pc01hdGNoZXIoZXhwKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWV4cC50ZXN0KGFjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc2lub24udHlwZU9mKGV4cCkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaE9iamVjdChleHAsIGFjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXNpbm9uLmRlZXBFcXVhbChleHAsIGFjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBtYXRjaGVyLm9yID0gZnVuY3Rpb24gKG0yKSB7XG4gICAgICAgIGlmICghaXNNYXRjaGVyKG0yKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk1hdGNoZXIgZXhwZWN0ZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG0xID0gdGhpcztcbiAgICAgICAgdmFyIG9yID0gc2lub24uY3JlYXRlKG1hdGNoZXIpO1xuICAgICAgICBvci50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIG0xLnRlc3QoYWN0dWFsKSB8fCBtMi50ZXN0KGFjdHVhbCk7XG4gICAgICAgIH07XG4gICAgICAgIG9yLm1lc3NhZ2UgPSBtMS5tZXNzYWdlICsgXCIub3IoXCIgKyBtMi5tZXNzYWdlICsgXCIpXCI7XG4gICAgICAgIHJldHVybiBvcjtcbiAgICB9O1xuXG4gICAgbWF0Y2hlci5hbmQgPSBmdW5jdGlvbiAobTIpIHtcbiAgICAgICAgaWYgKCFpc01hdGNoZXIobTIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTWF0Y2hlciBleHBlY3RlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbTEgPSB0aGlzO1xuICAgICAgICB2YXIgYW5kID0gc2lub24uY3JlYXRlKG1hdGNoZXIpO1xuICAgICAgICBhbmQudGVzdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgICAgIHJldHVybiBtMS50ZXN0KGFjdHVhbCkgJiYgbTIudGVzdChhY3R1YWwpO1xuICAgICAgICB9O1xuICAgICAgICBhbmQubWVzc2FnZSA9IG0xLm1lc3NhZ2UgKyBcIi5hbmQoXCIgKyBtMi5tZXNzYWdlICsgXCIpXCI7XG4gICAgICAgIHJldHVybiBhbmQ7XG4gICAgfTtcblxuICAgIHZhciBtYXRjaCA9IGZ1bmN0aW9uIChleHBlY3RhdGlvbiwgbWVzc2FnZSkge1xuICAgICAgICB2YXIgbSA9IHNpbm9uLmNyZWF0ZShtYXRjaGVyKTtcbiAgICAgICAgdmFyIHR5cGUgPSBzaW5vbi50eXBlT2YoZXhwZWN0YXRpb24pO1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHBlY3RhdGlvbi50ZXN0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICBtLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBleHBlY3RhdGlvbi50ZXN0KGFjdHVhbCkgPT09IHRydWU7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBtLm1lc3NhZ2UgPSBcIm1hdGNoKFwiICsgc2lub24uZnVuY3Rpb25OYW1lKGV4cGVjdGF0aW9uLnRlc3QpICsgXCIpXCI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc3RyID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoZXhwZWN0YXRpb24uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBzdHIucHVzaChrZXkgKyBcIjogXCIgKyBleHBlY3RhdGlvbltrZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtLnRlc3QgPSBmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoT2JqZWN0KGV4cGVjdGF0aW9uLCBhY3R1YWwpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG0ubWVzc2FnZSA9IFwibWF0Y2goXCIgKyBzdHIuam9pbihcIiwgXCIpICsgXCIpXCI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgbS50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBleHBlY3RhdGlvbiA9PSBhY3R1YWw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgICAgIG0udGVzdCA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFjdHVhbCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBhY3R1YWwuaW5kZXhPZihleHBlY3RhdGlvbikgIT09IC0xO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG0ubWVzc2FnZSA9IFwibWF0Y2goXFxcIlwiICsgZXhwZWN0YXRpb24gKyBcIlxcXCIpXCI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInJlZ2V4cFwiOlxuICAgICAgICAgICAgbS50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0dWFsICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cGVjdGF0aW9uLnRlc3QoYWN0dWFsKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgICAgICBtLnRlc3QgPSBleHBlY3RhdGlvbjtcbiAgICAgICAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgbS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbS5tZXNzYWdlID0gXCJtYXRjaChcIiArIHNpbm9uLmZ1bmN0aW9uTmFtZShleHBlY3RhdGlvbikgKyBcIilcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgbS50ZXN0ID0gZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2lub24uZGVlcEVxdWFsKGV4cGVjdGF0aW9uLCBhY3R1YWwpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW0ubWVzc2FnZSkge1xuICAgICAgICAgICAgbS5tZXNzYWdlID0gXCJtYXRjaChcIiArIGV4cGVjdGF0aW9uICsgXCIpXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcblxuICAgIG1hdGNoLmlzTWF0Y2hlciA9IGlzTWF0Y2hlcjtcblxuICAgIG1hdGNoLmFueSA9IG1hdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSwgXCJhbnlcIik7XG5cbiAgICBtYXRjaC5kZWZpbmVkID0gbWF0Y2goZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICByZXR1cm4gYWN0dWFsICE9PSBudWxsICYmIGFjdHVhbCAhPT0gdW5kZWZpbmVkO1xuICAgIH0sIFwiZGVmaW5lZFwiKTtcblxuICAgIG1hdGNoLnRydXRoeSA9IG1hdGNoKGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICAgICAgcmV0dXJuICEhYWN0dWFsO1xuICAgIH0sIFwidHJ1dGh5XCIpO1xuXG4gICAgbWF0Y2guZmFsc3kgPSBtYXRjaChmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgIHJldHVybiAhYWN0dWFsO1xuICAgIH0sIFwiZmFsc3lcIik7XG5cbiAgICBtYXRjaC5zYW1lID0gZnVuY3Rpb24gKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgIHJldHVybiBtYXRjaChmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0YXRpb24gPT09IGFjdHVhbDtcbiAgICAgICAgfSwgXCJzYW1lKFwiICsgZXhwZWN0YXRpb24gKyBcIilcIik7XG4gICAgfTtcblxuICAgIG1hdGNoLnR5cGVPZiA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgIGFzc2VydFR5cGUodHlwZSwgXCJzdHJpbmdcIiwgXCJ0eXBlXCIpO1xuICAgICAgICByZXR1cm4gbWF0Y2goZnVuY3Rpb24gKGFjdHVhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHNpbm9uLnR5cGVPZihhY3R1YWwpID09PSB0eXBlO1xuICAgICAgICB9LCBcInR5cGVPZihcXFwiXCIgKyB0eXBlICsgXCJcXFwiKVwiKTtcbiAgICB9O1xuXG4gICAgbWF0Y2guaW5zdGFuY2VPZiA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgICAgIGFzc2VydFR5cGUodHlwZSwgXCJmdW5jdGlvblwiLCBcInR5cGVcIik7XG4gICAgICAgIHJldHVybiBtYXRjaChmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICByZXR1cm4gYWN0dWFsIGluc3RhbmNlb2YgdHlwZTtcbiAgICAgICAgfSwgXCJpbnN0YW5jZU9mKFwiICsgc2lub24uZnVuY3Rpb25OYW1lKHR5cGUpICsgXCIpXCIpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVQcm9wZXJ0eU1hdGNoZXIocHJvcGVydHlUZXN0LCBtZXNzYWdlUHJlZml4KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAocHJvcGVydHksIHZhbHVlKSB7XG4gICAgICAgICAgICBhc3NlcnRUeXBlKHByb3BlcnR5LCBcInN0cmluZ1wiLCBcInByb3BlcnR5XCIpO1xuICAgICAgICAgICAgdmFyIG9ubHlQcm9wZXJ0eSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDE7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IG1lc3NhZ2VQcmVmaXggKyBcIihcXFwiXCIgKyBwcm9wZXJ0eSArIFwiXFxcIlwiO1xuICAgICAgICAgICAgaWYgKCFvbmx5UHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlICs9IFwiLCBcIiArIHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWVzc2FnZSArPSBcIilcIjtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaChmdW5jdGlvbiAoYWN0dWFsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFjdHVhbCA9PT0gdW5kZWZpbmVkIHx8IGFjdHVhbCA9PT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgIXByb3BlcnR5VGVzdChhY3R1YWwsIHByb3BlcnR5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBvbmx5UHJvcGVydHkgfHwgc2lub24uZGVlcEVxdWFsKHZhbHVlLCBhY3R1YWxbcHJvcGVydHldKTtcbiAgICAgICAgICAgIH0sIG1lc3NhZ2UpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIG1hdGNoLmhhcyA9IGNyZWF0ZVByb3BlcnR5TWF0Y2hlcihmdW5jdGlvbiAoYWN0dWFsLCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAodHlwZW9mIGFjdHVhbCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5IGluIGFjdHVhbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0dWFsW3Byb3BlcnR5XSAhPT0gdW5kZWZpbmVkO1xuICAgIH0sIFwiaGFzXCIpO1xuXG4gICAgbWF0Y2guaGFzT3duID0gY3JlYXRlUHJvcGVydHlNYXRjaGVyKGZ1bmN0aW9uIChhY3R1YWwsIHByb3BlcnR5KSB7XG4gICAgICAgIHJldHVybiBhY3R1YWwuaGFzT3duUHJvcGVydHkocHJvcGVydHkpO1xuICAgIH0sIFwiaGFzT3duXCIpO1xuXG4gICAgbWF0Y2guYm9vbCA9IG1hdGNoLnR5cGVPZihcImJvb2xlYW5cIik7XG4gICAgbWF0Y2gubnVtYmVyID0gbWF0Y2gudHlwZU9mKFwibnVtYmVyXCIpO1xuICAgIG1hdGNoLnN0cmluZyA9IG1hdGNoLnR5cGVPZihcInN0cmluZ1wiKTtcbiAgICBtYXRjaC5vYmplY3QgPSBtYXRjaC50eXBlT2YoXCJvYmplY3RcIik7XG4gICAgbWF0Y2guZnVuYyA9IG1hdGNoLnR5cGVPZihcImZ1bmN0aW9uXCIpO1xuICAgIG1hdGNoLmFycmF5ID0gbWF0Y2gudHlwZU9mKFwiYXJyYXlcIik7XG4gICAgbWF0Y2gucmVnZXhwID0gbWF0Y2gudHlwZU9mKFwicmVnZXhwXCIpO1xuICAgIG1hdGNoLmRhdGUgPSBtYXRjaC50eXBlT2YoXCJkYXRlXCIpO1xuXG4gICAgaWYgKGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbWF0Y2g7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2lub24ubWF0Y2ggPSBtYXRjaDtcbiAgICB9XG59KHR5cGVvZiBzaW5vbiA9PSBcIm9iamVjdFwiICYmIHNpbm9uIHx8IG51bGwpKTtcbiIsIi8qKlxuICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICogQGRlcGVuZCBzdHViLmpzXG4gKi9cbi8qanNsaW50IGVxZXFlcTogZmFsc2UsIG9uZXZhcjogZmFsc2UsIG5vbWVuOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICogTW9jayBmdW5jdGlvbnMuXG4gKlxuICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcbiAgICB2YXIgcHVzaCA9IFtdLnB1c2g7XG4gICAgdmFyIG1hdGNoO1xuXG4gICAgaWYgKCFzaW5vbiAmJiBjb21tb25KU01vZHVsZSkge1xuICAgICAgICBzaW5vbiA9IHJlcXVpcmUoXCIuLi9zaW5vblwiKTtcbiAgICB9XG5cbiAgICBpZiAoIXNpbm9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBtYXRjaCA9IHNpbm9uLm1hdGNoO1xuXG4gICAgaWYgKCFtYXRjaCAmJiBjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtYXRjaCA9IHJlcXVpcmUoXCIuL21hdGNoXCIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1vY2sob2JqZWN0KSB7XG4gICAgICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgICAgICByZXR1cm4gc2lub24uZXhwZWN0YXRpb24uY3JlYXRlKFwiQW5vbnltb3VzIG1vY2tcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbW9jay5jcmVhdGUob2JqZWN0KTtcbiAgICB9XG5cbiAgICBzaW5vbi5tb2NrID0gbW9jaztcblxuICAgIHNpbm9uLmV4dGVuZChtb2NrLCAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBlYWNoKGNvbGxlY3Rpb24sIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY29sbGVjdGlvbi5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhjb2xsZWN0aW9uW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShvYmplY3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwib2JqZWN0IGlzIG51bGxcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG1vY2tPYmplY3QgPSBzaW5vbi5leHRlbmQoe30sIG1vY2spO1xuICAgICAgICAgICAgICAgIG1vY2tPYmplY3Qub2JqZWN0ID0gb2JqZWN0O1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBtb2NrT2JqZWN0LmNyZWF0ZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBtb2NrT2JqZWN0O1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZXhwZWN0czogZnVuY3Rpb24gZXhwZWN0cyhtZXRob2QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW1ldGhvZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwibWV0aG9kIGlzIGZhbHN5XCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5leHBlY3RhdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBlY3RhdGlvbnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm94aWVzID0gW107XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmV4cGVjdGF0aW9uc1ttZXRob2RdKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwZWN0YXRpb25zW21ldGhvZF0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1vY2tPYmplY3QgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgICAgIHNpbm9uLndyYXBNZXRob2QodGhpcy5vYmplY3QsIG1ldGhvZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1vY2tPYmplY3QuaW52b2tlTWV0aG9kKG1ldGhvZCwgdGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMucHJveGllcywgbWV0aG9kKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZXhwZWN0YXRpb24gPSBzaW5vbi5leHBlY3RhdGlvbi5jcmVhdGUobWV0aG9kKTtcbiAgICAgICAgICAgICAgICBwdXNoLmNhbGwodGhpcy5leHBlY3RhdGlvbnNbbWV0aG9kXSwgZXhwZWN0YXRpb24pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cGVjdGF0aW9uO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzdG9yZTogZnVuY3Rpb24gcmVzdG9yZSgpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2JqZWN0ID0gdGhpcy5vYmplY3Q7XG5cbiAgICAgICAgICAgICAgICBlYWNoKHRoaXMucHJveGllcywgZnVuY3Rpb24gKHByb3h5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0W3Byb3h5XS5yZXN0b3JlID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W3Byb3h5XS5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHZlcmlmeTogZnVuY3Rpb24gdmVyaWZ5KCkge1xuICAgICAgICAgICAgICAgIHZhciBleHBlY3RhdGlvbnMgPSB0aGlzLmV4cGVjdGF0aW9ucyB8fCB7fTtcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZXMgPSBbXSwgbWV0ID0gW107XG5cbiAgICAgICAgICAgICAgICBlYWNoKHRoaXMucHJveGllcywgZnVuY3Rpb24gKHByb3h5KSB7XG4gICAgICAgICAgICAgICAgICAgIGVhY2goZXhwZWN0YXRpb25zW3Byb3h5XSwgZnVuY3Rpb24gKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWV4cGVjdGF0aW9uLm1ldCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKG1lc3NhZ2VzLCBleHBlY3RhdGlvbi50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKG1ldCwgZXhwZWN0YXRpb24udG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5yZXN0b3JlKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAobWVzc2FnZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKG1lc3NhZ2VzLmNvbmNhdChtZXQpLmpvaW4oXCJcXG5cIikpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbm9uLmV4cGVjdGF0aW9uLnBhc3MobWVzc2FnZXMuY29uY2F0KG1ldCkuam9pbihcIlxcblwiKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBpbnZva2VNZXRob2Q6IGZ1bmN0aW9uIGludm9rZU1ldGhvZChtZXRob2QsIHRoaXNWYWx1ZSwgYXJncykge1xuICAgICAgICAgICAgICAgIHZhciBleHBlY3RhdGlvbnMgPSB0aGlzLmV4cGVjdGF0aW9ucyAmJiB0aGlzLmV4cGVjdGF0aW9uc1ttZXRob2RdO1xuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBleHBlY3RhdGlvbnMgJiYgZXhwZWN0YXRpb25zLmxlbmd0aCB8fCAwLCBpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZXhwZWN0YXRpb25zW2ldLm1ldCgpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RhdGlvbnNbaV0uYWxsb3dzQ2FsbCh0aGlzVmFsdWUsIGFyZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXhwZWN0YXRpb25zW2ldLmFwcGx5KHRoaXNWYWx1ZSwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZXMgPSBbXSwgYXZhaWxhYmxlLCBleGhhdXN0ZWQgPSAwO1xuXG4gICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleHBlY3RhdGlvbnNbaV0uYWxsb3dzQ2FsbCh0aGlzVmFsdWUsIGFyZ3MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGUgPSBhdmFpbGFibGUgfHwgZXhwZWN0YXRpb25zW2ldO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXhoYXVzdGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKG1lc3NhZ2VzLCBcIiAgICBcIiArIGV4cGVjdGF0aW9uc1tpXS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZXhoYXVzdGVkID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhdmFpbGFibGUuYXBwbHkodGhpc1ZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBtZXNzYWdlcy51bnNoaWZ0KFwiVW5leHBlY3RlZCBjYWxsOiBcIiArIHNpbm9uLnNweUNhbGwudG9TdHJpbmcuY2FsbCh7XG4gICAgICAgICAgICAgICAgICAgIHByb3h5OiBtZXRob2QsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IGFyZ3NcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKG1lc3NhZ2VzLmpvaW4oXCJcXG5cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0oKSkpO1xuXG4gICAgdmFyIHRpbWVzID0gc2lub24udGltZXNJbldvcmRzO1xuXG4gICAgc2lub24uZXhwZWN0YXRpb24gPSAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG4gICAgICAgIHZhciBfaW52b2tlID0gc2lub24uc3B5Lmludm9rZTtcblxuICAgICAgICBmdW5jdGlvbiBjYWxsQ291bnRJbldvcmRzKGNhbGxDb3VudCkge1xuICAgICAgICAgICAgaWYgKGNhbGxDb3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibmV2ZXIgY2FsbGVkXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBcImNhbGxlZCBcIiArIHRpbWVzKGNhbGxDb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBleHBlY3RlZENhbGxDb3VudEluV29yZHMoZXhwZWN0YXRpb24pIHtcbiAgICAgICAgICAgIHZhciBtaW4gPSBleHBlY3RhdGlvbi5taW5DYWxscztcbiAgICAgICAgICAgIHZhciBtYXggPSBleHBlY3RhdGlvbi5tYXhDYWxscztcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBtaW4gPT0gXCJudW1iZXJcIiAmJiB0eXBlb2YgbWF4ID09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gdGltZXMobWluKTtcblxuICAgICAgICAgICAgICAgIGlmIChtaW4gIT0gbWF4KSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ciA9IFwiYXQgbGVhc3QgXCIgKyBzdHIgKyBcIiBhbmQgYXQgbW9zdCBcIiArIHRpbWVzKG1heCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBtaW4gPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBcImF0IGxlYXN0IFwiICsgdGltZXMobWluKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFwiYXQgbW9zdCBcIiArIHRpbWVzKG1heCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZWNlaXZlZE1pbkNhbGxzKGV4cGVjdGF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgaGFzTWluTGltaXQgPSB0eXBlb2YgZXhwZWN0YXRpb24ubWluQ2FsbHMgPT0gXCJudW1iZXJcIjtcbiAgICAgICAgICAgIHJldHVybiAhaGFzTWluTGltaXQgfHwgZXhwZWN0YXRpb24uY2FsbENvdW50ID49IGV4cGVjdGF0aW9uLm1pbkNhbGxzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVjZWl2ZWRNYXhDYWxscyhleHBlY3RhdGlvbikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBleHBlY3RhdGlvbi5tYXhDYWxscyAhPSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZXhwZWN0YXRpb24uY2FsbENvdW50ID09IGV4cGVjdGF0aW9uLm1heENhbGxzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gdmVyaWZ5TWF0Y2hlcihwb3NzaWJsZU1hdGNoZXIsIGFyZyl7XG4gICAgICAgICAgICBpZiAobWF0Y2ggJiYgbWF0Y2guaXNNYXRjaGVyKHBvc3NpYmxlTWF0Y2hlcikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zc2libGVNYXRjaGVyLnRlc3QoYXJnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWluQ2FsbHM6IDEsXG4gICAgICAgICAgICBtYXhDYWxsczogMSxcblxuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiBjcmVhdGUobWV0aG9kTmFtZSkge1xuICAgICAgICAgICAgICAgIHZhciBleHBlY3RhdGlvbiA9IHNpbm9uLmV4dGVuZChzaW5vbi5zdHViLmNyZWF0ZSgpLCBzaW5vbi5leHBlY3RhdGlvbik7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGV4cGVjdGF0aW9uLmNyZWF0ZTtcbiAgICAgICAgICAgICAgICBleHBlY3RhdGlvbi5tZXRob2QgPSBtZXRob2ROYW1lO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4cGVjdGF0aW9uO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgaW52b2tlOiBmdW5jdGlvbiBpbnZva2UoZnVuYywgdGhpc1ZhbHVlLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnlDYWxsQWxsb3dlZCh0aGlzVmFsdWUsIGFyZ3MpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIF9pbnZva2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGF0TGVhc3Q6IGZ1bmN0aW9uIGF0TGVhc3QobnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBudW0gIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiJ1wiICsgbnVtICsgXCInIGlzIG5vdCBudW1iZXJcIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmxpbWl0c1NldCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1heENhbGxzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW1pdHNTZXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMubWluQ2FsbHMgPSBudW07XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGF0TW9zdDogZnVuY3Rpb24gYXRNb3N0KG51bSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbnVtICE9IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIidcIiArIG51bSArIFwiJyBpcyBub3QgbnVtYmVyXCIpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5saW1pdHNTZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5taW5DYWxscyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGltaXRzU2V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLm1heENhbGxzID0gbnVtO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBuZXZlcjogZnVuY3Rpb24gbmV2ZXIoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhhY3RseSgwKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uY2U6IGZ1bmN0aW9uIG9uY2UoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhhY3RseSgxKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHR3aWNlOiBmdW5jdGlvbiB0d2ljZSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5leGFjdGx5KDIpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdGhyaWNlOiBmdW5jdGlvbiB0aHJpY2UoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXhhY3RseSgzKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGV4YWN0bHk6IGZ1bmN0aW9uIGV4YWN0bHkobnVtKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBudW0gIT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiJ1wiICsgbnVtICsgXCInIGlzIG5vdCBhIG51bWJlclwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmF0TGVhc3QobnVtKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hdE1vc3QobnVtKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG1ldDogZnVuY3Rpb24gbWV0KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5mYWlsZWQgJiYgcmVjZWl2ZWRNaW5DYWxscyh0aGlzKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHZlcmlmeUNhbGxBbGxvd2VkOiBmdW5jdGlvbiB2ZXJpZnlDYWxsQWxsb3dlZCh0aGlzVmFsdWUsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAocmVjZWl2ZWRNYXhDYWxscyh0aGlzKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHNpbm9uLmV4cGVjdGF0aW9uLmZhaWwodGhpcy5tZXRob2QgKyBcIiBhbHJlYWR5IGNhbGxlZCBcIiArIHRpbWVzKHRoaXMubWF4Q2FsbHMpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoXCJleHBlY3RlZFRoaXNcIiBpbiB0aGlzICYmIHRoaXMuZXhwZWN0ZWRUaGlzICE9PSB0aGlzVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24uZmFpbCh0aGlzLm1ldGhvZCArIFwiIGNhbGxlZCB3aXRoIFwiICsgdGhpc1ZhbHVlICsgXCIgYXMgdGhpc1ZhbHVlLCBleHBlY3RlZCBcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGVjdGVkVGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCEoXCJleHBlY3RlZEFyZ3VtZW50c1wiIGluIHRoaXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24uZmFpbCh0aGlzLm1ldGhvZCArIFwiIHJlY2VpdmVkIG5vIGFyZ3VtZW50cywgZXhwZWN0ZWQgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lub24uZm9ybWF0KHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPCB0aGlzLmV4cGVjdGVkQXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKHRoaXMubWV0aG9kICsgXCIgcmVjZWl2ZWQgdG9vIGZldyBhcmd1bWVudHMgKFwiICsgc2lub24uZm9ybWF0KGFyZ3MpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiKSwgZXhwZWN0ZWQgXCIgKyBzaW5vbi5mb3JtYXQodGhpcy5leHBlY3RlZEFyZ3VtZW50cykpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmV4cGVjdHNFeGFjdEFyZ0NvdW50ICYmXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoICE9IHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpbm9uLmV4cGVjdGF0aW9uLmZhaWwodGhpcy5tZXRob2QgKyBcIiByZWNlaXZlZCB0b28gbWFueSBhcmd1bWVudHMgKFwiICsgc2lub24uZm9ybWF0KGFyZ3MpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiKSwgZXhwZWN0ZWQgXCIgKyBzaW5vbi5mb3JtYXQodGhpcy5leHBlY3RlZEFyZ3VtZW50cykpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5leHBlY3RlZEFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXZlcmlmeU1hdGNoZXIodGhpcy5leHBlY3RlZEFyZ3VtZW50c1tpXSxhcmdzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24uZmFpbCh0aGlzLm1ldGhvZCArIFwiIHJlY2VpdmVkIHdyb25nIGFyZ3VtZW50cyBcIiArIHNpbm9uLmZvcm1hdChhcmdzKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIsIGRpZG4ndCBtYXRjaCBcIiArIHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoIXNpbm9uLmRlZXBFcXVhbCh0aGlzLmV4cGVjdGVkQXJndW1lbnRzW2ldLCBhcmdzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24uZmFpbCh0aGlzLm1ldGhvZCArIFwiIHJlY2VpdmVkIHdyb25nIGFyZ3VtZW50cyBcIiArIHNpbm9uLmZvcm1hdChhcmdzKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIsIGV4cGVjdGVkIFwiICsgc2lub24uZm9ybWF0KHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFsbG93c0NhbGw6IGZ1bmN0aW9uIGFsbG93c0NhbGwodGhpc1ZhbHVlLCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWV0KCkgJiYgcmVjZWl2ZWRNYXhDYWxscyh0aGlzKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKFwiZXhwZWN0ZWRUaGlzXCIgaW4gdGhpcyAmJiB0aGlzLmV4cGVjdGVkVGhpcyAhPT0gdGhpc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIShcImV4cGVjdGVkQXJndW1lbnRzXCIgaW4gdGhpcykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYXJncyA9IGFyZ3MgfHwgW107XG5cbiAgICAgICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPCB0aGlzLmV4cGVjdGVkQXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZXhwZWN0c0V4YWN0QXJnQ291bnQgJiZcbiAgICAgICAgICAgICAgICAgICAgYXJncy5sZW5ndGggIT0gdGhpcy5leHBlY3RlZEFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5leHBlY3RlZEFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2ZXJpZnlNYXRjaGVyKHRoaXMuZXhwZWN0ZWRBcmd1bWVudHNbaV0sYXJnc1tpXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICghc2lub24uZGVlcEVxdWFsKHRoaXMuZXhwZWN0ZWRBcmd1bWVudHNbaV0sIGFyZ3NbaV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHdpdGhBcmdzOiBmdW5jdGlvbiB3aXRoQXJncygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGVjdGVkQXJndW1lbnRzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgd2l0aEV4YWN0QXJnczogZnVuY3Rpb24gd2l0aEV4YWN0QXJncygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndpdGhBcmdzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgdGhpcy5leHBlY3RzRXhhY3RBcmdDb3VudCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvbjogZnVuY3Rpb24gb24odGhpc1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5leHBlY3RlZFRoaXMgPSB0aGlzVmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gKHRoaXMuZXhwZWN0ZWRBcmd1bWVudHMgfHwgW10pLnNsaWNlKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZXhwZWN0c0V4YWN0QXJnQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKGFyZ3MsIFwiWy4uLl1cIik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGNhbGxTdHIgPSBzaW5vbi5zcHlDYWxsLnRvU3RyaW5nLmNhbGwoe1xuICAgICAgICAgICAgICAgICAgICBwcm94eTogdGhpcy5tZXRob2QgfHwgXCJhbm9ueW1vdXMgbW9jayBleHBlY3RhdGlvblwiLFxuICAgICAgICAgICAgICAgICAgICBhcmdzOiBhcmdzXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9IGNhbGxTdHIucmVwbGFjZShcIiwgWy4uLlwiLCBcIlssIC4uLlwiKSArIFwiIFwiICtcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWRDYWxsQ291bnRJbldvcmRzKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWV0KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRXhwZWN0YXRpb24gbWV0OiBcIiArIG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiRXhwZWN0ZWQgXCIgKyBtZXNzYWdlICsgXCIgKFwiICtcbiAgICAgICAgICAgICAgICAgICAgY2FsbENvdW50SW5Xb3Jkcyh0aGlzLmNhbGxDb3VudCkgKyBcIilcIjtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHZlcmlmeTogZnVuY3Rpb24gdmVyaWZ5KCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5tZXQoKSkge1xuICAgICAgICAgICAgICAgICAgICBzaW5vbi5leHBlY3RhdGlvbi5mYWlsKHRoaXMudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2lub24uZXhwZWN0YXRpb24ucGFzcyh0aGlzLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcGFzczogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICAgICAgICBzaW5vbi5hc3NlcnQucGFzcyhtZXNzYWdlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmYWlsOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIHZhciBleGNlcHRpb24gPSBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uLm5hbWUgPSBcIkV4cGVjdGF0aW9uRXJyb3JcIjtcblxuICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KCkpO1xuXG4gICAgaWYgKGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbW9jaztcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi5tb2NrID0gbW9jaztcbiAgICB9XG59KHR5cGVvZiBzaW5vbiA9PSBcIm9iamVjdFwiICYmIHNpbm9uIHx8IG51bGwpKTtcbiIsIi8qKlxuICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICogQGRlcGVuZCBjb2xsZWN0aW9uLmpzXG4gKiBAZGVwZW5kIHV0aWwvZmFrZV90aW1lcnMuanNcbiAqIEBkZXBlbmQgdXRpbC9mYWtlX3NlcnZlcl93aXRoX2Nsb2NrLmpzXG4gKi9cbi8qanNsaW50IGVxZXFlcTogZmFsc2UsIG9uZXZhcjogZmFsc2UsIHBsdXNwbHVzOiBmYWxzZSovXG4vKmdsb2JhbCByZXF1aXJlLCBtb2R1bGUqL1xuLyoqXG4gKiBNYW5hZ2VzIGZha2UgY29sbGVjdGlvbnMgYXMgd2VsbCBhcyBmYWtlIHV0aWxpdGllcyBzdWNoIGFzIFNpbm9uJ3NcbiAqIHRpbWVycyBhbmQgZmFrZSBYSFIgaW1wbGVtZW50YXRpb24gaW4gb25lIGNvbnZlbmllbnQgb2JqZWN0LlxuICpcbiAqIEBhdXRob3IgQ2hyaXN0aWFuIEpvaGFuc2VuIChjaHJpc3RpYW5AY2pvaGFuc2VuLm5vKVxuICogQGxpY2Vuc2UgQlNEXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLTIwMTMgQ2hyaXN0aWFuIEpvaGFuc2VuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICB2YXIgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgc2lub24uZXh0ZW5kKHNpbm9uLCByZXF1aXJlKFwiLi91dGlsL2Zha2VfdGltZXJzXCIpKTtcbn1cblxuKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHVzaCA9IFtdLnB1c2g7XG5cbiAgICBmdW5jdGlvbiBleHBvc2VWYWx1ZShzYW5kYm94LCBjb25maWcsIGtleSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy5pbmplY3RJbnRvICYmICEoa2V5IGluIGNvbmZpZy5pbmplY3RJbnRvKSApIHtcbiAgICAgICAgICAgIGNvbmZpZy5pbmplY3RJbnRvW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHB1c2guY2FsbChzYW5kYm94LmFyZ3MsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByZXBhcmVTYW5kYm94RnJvbUNvbmZpZyhjb25maWcpIHtcbiAgICAgICAgdmFyIHNhbmRib3ggPSBzaW5vbi5jcmVhdGUoc2lub24uc2FuZGJveCk7XG5cbiAgICAgICAgaWYgKGNvbmZpZy51c2VGYWtlU2VydmVyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbmZpZy51c2VGYWtlU2VydmVyID09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBzYW5kYm94LnNlcnZlclByb3RvdHlwZSA9IGNvbmZpZy51c2VGYWtlU2VydmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzYW5kYm94LnVzZUZha2VTZXJ2ZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb25maWcudXNlRmFrZVRpbWVycykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb25maWcudXNlRmFrZVRpbWVycyA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgc2FuZGJveC51c2VGYWtlVGltZXJzLmFwcGx5KHNhbmRib3gsIGNvbmZpZy51c2VGYWtlVGltZXJzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2FuZGJveC51c2VGYWtlVGltZXJzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc2FuZGJveDtcbiAgICB9XG5cbiAgICBzaW5vbi5zYW5kYm94ID0gc2lub24uZXh0ZW5kKHNpbm9uLmNyZWF0ZShzaW5vbi5jb2xsZWN0aW9uKSwge1xuICAgICAgICB1c2VGYWtlVGltZXJzOiBmdW5jdGlvbiB1c2VGYWtlVGltZXJzKCkge1xuICAgICAgICAgICAgdGhpcy5jbG9jayA9IHNpbm9uLnVzZUZha2VUaW1lcnMuYXBwbHkoc2lub24sIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZCh0aGlzLmNsb2NrKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXJ2ZXJQcm90b3R5cGU6IHNpbm9uLmZha2VTZXJ2ZXIsXG5cbiAgICAgICAgdXNlRmFrZVNlcnZlcjogZnVuY3Rpb24gdXNlRmFrZVNlcnZlcigpIHtcbiAgICAgICAgICAgIHZhciBwcm90byA9IHRoaXMuc2VydmVyUHJvdG90eXBlIHx8IHNpbm9uLmZha2VTZXJ2ZXI7XG5cbiAgICAgICAgICAgIGlmICghcHJvdG8gfHwgIXByb3RvLmNyZWF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNlcnZlciA9IHByb3RvLmNyZWF0ZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkKHRoaXMuc2VydmVyKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbmplY3Q6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHNpbm9uLmNvbGxlY3Rpb24uaW5qZWN0LmNhbGwodGhpcywgb2JqKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY2xvY2spIHtcbiAgICAgICAgICAgICAgICBvYmouY2xvY2sgPSB0aGlzLmNsb2NrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5zZXJ2ZXIpIHtcbiAgICAgICAgICAgICAgICBvYmouc2VydmVyID0gdGhpcy5zZXJ2ZXI7XG4gICAgICAgICAgICAgICAgb2JqLnJlcXVlc3RzID0gdGhpcy5zZXJ2ZXIucmVxdWVzdHM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBvYmo7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW5vbi5jcmVhdGUoc2lub24uc2FuZGJveCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBzYW5kYm94ID0gcHJlcGFyZVNhbmRib3hGcm9tQ29uZmlnKGNvbmZpZyk7XG4gICAgICAgICAgICBzYW5kYm94LmFyZ3MgPSBzYW5kYm94LmFyZ3MgfHwgW107XG4gICAgICAgICAgICB2YXIgcHJvcCwgdmFsdWUsIGV4cG9zZWQgPSBzYW5kYm94LmluamVjdCh7fSk7XG5cbiAgICAgICAgICAgIGlmIChjb25maWcucHJvcGVydGllcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY29uZmlnLnByb3BlcnRpZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3AgPSBjb25maWcucHJvcGVydGllc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBleHBvc2VkW3Byb3BdIHx8IHByb3AgPT0gXCJzYW5kYm94XCIgJiYgc2FuZGJveDtcbiAgICAgICAgICAgICAgICAgICAgZXhwb3NlVmFsdWUoc2FuZGJveCwgY29uZmlnLCBwcm9wLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHBvc2VWYWx1ZShzYW5kYm94LCBjb25maWcsIFwic2FuZGJveFwiLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzYW5kYm94O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBzaW5vbi5zYW5kYm94LnVzZUZha2VYTUxIdHRwUmVxdWVzdCA9IHNpbm9uLnNhbmRib3gudXNlRmFrZVNlcnZlcjtcblxuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHNpbm9uLnNhbmRib3g7XG4gICAgfVxufSgpKTtcbiIsIi8qKlxuICAqIEBkZXBlbmQgLi4vc2lub24uanNcbiAgKiBAZGVwZW5kIGNhbGwuanNcbiAgKi9cbi8qanNsaW50IGVxZXFlcTogZmFsc2UsIG9uZXZhcjogZmFsc2UsIHBsdXNwbHVzOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICAqIFNweSBmdW5jdGlvbnNcbiAgKlxuICAqIEBhdXRob3IgQ2hyaXN0aWFuIEpvaGFuc2VuIChjaHJpc3RpYW5AY2pvaGFuc2VuLm5vKVxuICAqIEBsaWNlbnNlIEJTRFxuICAqXG4gICogQ29weXJpZ2h0IChjKSAyMDEwLTIwMTMgQ2hyaXN0aWFuIEpvaGFuc2VuXG4gICovXG5cInVzZSBzdHJpY3RcIjtcblxuKGZ1bmN0aW9uIChzaW5vbikge1xuICAgIHZhciBjb21tb25KU01vZHVsZSA9IHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzO1xuICAgIHZhciBwdXNoID0gQXJyYXkucHJvdG90eXBlLnB1c2g7XG4gICAgdmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xuICAgIHZhciBjYWxsSWQgPSAwO1xuXG4gICAgaWYgKCFzaW5vbiAmJiBjb21tb25KU01vZHVsZSkge1xuICAgICAgICBzaW5vbiA9IHJlcXVpcmUoXCIuLi9zaW5vblwiKTtcbiAgICB9XG5cbiAgICBpZiAoIXNpbm9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzcHkob2JqZWN0LCBwcm9wZXJ0eSkge1xuICAgICAgICBpZiAoIXByb3BlcnR5ICYmIHR5cGVvZiBvYmplY3QgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gc3B5LmNyZWF0ZShvYmplY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvYmplY3QgJiYgIXByb3BlcnR5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3B5LmNyZWF0ZShmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1ldGhvZCA9IG9iamVjdFtwcm9wZXJ0eV07XG4gICAgICAgIHJldHVybiBzaW5vbi53cmFwTWV0aG9kKG9iamVjdCwgcHJvcGVydHksIHNweS5jcmVhdGUobWV0aG9kKSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWF0Y2hpbmdGYWtlKGZha2VzLCBhcmdzLCBzdHJpY3QpIHtcbiAgICAgICAgaWYgKCFmYWtlcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmYWtlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChmYWtlc1tpXS5tYXRjaGVzKGFyZ3MsIHN0cmljdCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFrZXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpbmNyZW1lbnRDYWxsQ291bnQoKSB7XG4gICAgICAgIHRoaXMuY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5jYWxsQ291bnQgKz0gMTtcbiAgICAgICAgdGhpcy5ub3RDYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jYWxsZWRPbmNlID0gdGhpcy5jYWxsQ291bnQgPT0gMTtcbiAgICAgICAgdGhpcy5jYWxsZWRUd2ljZSA9IHRoaXMuY2FsbENvdW50ID09IDI7XG4gICAgICAgIHRoaXMuY2FsbGVkVGhyaWNlID0gdGhpcy5jYWxsQ291bnQgPT0gMztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDYWxsUHJvcGVydGllcygpIHtcbiAgICAgICAgdGhpcy5maXJzdENhbGwgPSB0aGlzLmdldENhbGwoMCk7XG4gICAgICAgIHRoaXMuc2Vjb25kQ2FsbCA9IHRoaXMuZ2V0Q2FsbCgxKTtcbiAgICAgICAgdGhpcy50aGlyZENhbGwgPSB0aGlzLmdldENhbGwoMik7XG4gICAgICAgIHRoaXMubGFzdENhbGwgPSB0aGlzLmdldENhbGwodGhpcy5jYWxsQ291bnQgLSAxKTtcbiAgICB9XG5cbiAgICB2YXIgdmFycyA9IFwiYSxiLGMsZCxlLGYsZyxoLGksaixrLGxcIjtcbiAgICBmdW5jdGlvbiBjcmVhdGVQcm94eShmdW5jKSB7XG4gICAgICAgIC8vIFJldGFpbiB0aGUgZnVuY3Rpb24gbGVuZ3RoOlxuICAgICAgICB2YXIgcDtcbiAgICAgICAgaWYgKGZ1bmMubGVuZ3RoKSB7XG4gICAgICAgICAgICBldmFsKFwicCA9IChmdW5jdGlvbiBwcm94eShcIiArIHZhcnMuc3Vic3RyaW5nKDAsIGZ1bmMubGVuZ3RoICogMiAtIDEpICtcbiAgICAgICAgICAgICAgICBcIikgeyByZXR1cm4gcC5pbnZva2UoZnVuYywgdGhpcywgc2xpY2UuY2FsbChhcmd1bWVudHMpKTsgfSk7XCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcCA9IGZ1bmN0aW9uIHByb3h5KCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwLmludm9rZShmdW5jLCB0aGlzLCBzbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG5cbiAgICB2YXIgdXVpZCA9IDA7XG5cbiAgICAvLyBQdWJsaWMgQVBJXG4gICAgdmFyIHNweUFwaSA9IHtcbiAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLm5vdENhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmNhbGxlZE9uY2UgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGVkVHdpY2UgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuY2FsbGVkVGhyaWNlID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmNhbGxDb3VudCA9IDA7XG4gICAgICAgICAgICB0aGlzLmZpcnN0Q2FsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnNlY29uZENhbGwgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy50aGlyZENhbGwgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5sYXN0Q2FsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmFyZ3MgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucmV0dXJuVmFsdWVzID0gW107XG4gICAgICAgICAgICB0aGlzLnRoaXNWYWx1ZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZXhjZXB0aW9ucyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5jYWxsSWRzID0gW107XG4gICAgICAgICAgICBpZiAodGhpcy5mYWtlcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mYWtlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZha2VzW2ldLnJlc2V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKGZ1bmMpIHtcbiAgICAgICAgICAgIHZhciBuYW1lO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGZ1bmMgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgZnVuYyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IHNpbm9uLmZ1bmN0aW9uTmFtZShmdW5jKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHByb3h5ID0gY3JlYXRlUHJveHkoZnVuYyk7XG5cbiAgICAgICAgICAgIHNpbm9uLmV4dGVuZChwcm94eSwgc3B5KTtcbiAgICAgICAgICAgIGRlbGV0ZSBwcm94eS5jcmVhdGU7XG4gICAgICAgICAgICBzaW5vbi5leHRlbmQocHJveHksIGZ1bmMpO1xuXG4gICAgICAgICAgICBwcm94eS5yZXNldCgpO1xuICAgICAgICAgICAgcHJveHkucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICAgICAgICBwcm94eS5kaXNwbGF5TmFtZSA9IG5hbWUgfHwgXCJzcHlcIjtcbiAgICAgICAgICAgIHByb3h5LnRvU3RyaW5nID0gc2lub24uZnVuY3Rpb25Ub1N0cmluZztcbiAgICAgICAgICAgIHByb3h5Ll9jcmVhdGUgPSBzaW5vbi5zcHkuY3JlYXRlO1xuICAgICAgICAgICAgcHJveHkuaWQgPSBcInNweSNcIiArIHV1aWQrKztcblxuICAgICAgICAgICAgcmV0dXJuIHByb3h5O1xuICAgICAgICB9LFxuXG4gICAgICAgIGludm9rZTogZnVuY3Rpb24gaW52b2tlKGZ1bmMsIHRoaXNWYWx1ZSwgYXJncykge1xuICAgICAgICAgICAgdmFyIG1hdGNoaW5nID0gbWF0Y2hpbmdGYWtlKHRoaXMuZmFrZXMsIGFyZ3MpO1xuICAgICAgICAgICAgdmFyIGV4Y2VwdGlvbiwgcmV0dXJuVmFsdWU7XG5cbiAgICAgICAgICAgIGluY3JlbWVudENhbGxDb3VudC5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMudGhpc1ZhbHVlcywgdGhpc1ZhbHVlKTtcbiAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLmFyZ3MsIGFyZ3MpO1xuICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMuY2FsbElkcywgY2FsbElkKyspO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IG1hdGNoaW5nLmludm9rZShmdW5jLCB0aGlzVmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVyblZhbHVlID0gKHRoaXMuZnVuYyB8fCBmdW5jKS5hcHBseSh0aGlzVmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciB0aGlzQ2FsbCA9IHRoaXMuZ2V0Q2FsbCh0aGlzLmNhbGxDb3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzQ2FsbC5jYWxsZWRXaXRoTmV3KCkgJiYgdHlwZW9mIHJldHVyblZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5WYWx1ZSA9IHRoaXNWYWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMuZXhjZXB0aW9ucywgZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLnJldHVyblZhbHVlcywgcmV0dXJuVmFsdWUpO1xuXG4gICAgICAgICAgICBjcmVhdGVDYWxsUHJvcGVydGllcy5jYWxsKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAoZXhjZXB0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBleGNlcHRpb247XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDYWxsOiBmdW5jdGlvbiBnZXRDYWxsKGkpIHtcbiAgICAgICAgICAgIGlmIChpIDwgMCB8fCBpID49IHRoaXMuY2FsbENvdW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBzaW5vbi5zcHlDYWxsKHRoaXMsIHRoaXMudGhpc1ZhbHVlc1tpXSwgdGhpcy5hcmdzW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXR1cm5WYWx1ZXNbaV0sIHRoaXMuZXhjZXB0aW9uc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FsbElkc1tpXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Q2FsbHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjYWxscyA9IFtdO1xuICAgICAgICAgICAgdmFyIGk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmNhbGxDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2FsbHMucHVzaCh0aGlzLmdldENhbGwoaSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbHM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGVkQmVmb3JlOiBmdW5jdGlvbiBjYWxsZWRCZWZvcmUoc3B5Rm4pIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jYWxsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghc3B5Rm4uY2FsbGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhbGxJZHNbMF0gPCBzcHlGbi5jYWxsSWRzW3NweUZuLmNhbGxJZHMubGVuZ3RoIC0gMV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FsbGVkQWZ0ZXI6IGZ1bmN0aW9uIGNhbGxlZEFmdGVyKHNweUZuKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY2FsbGVkIHx8ICFzcHlGbi5jYWxsZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhbGxJZHNbdGhpcy5jYWxsQ291bnQgLSAxXSA+IHNweUZuLmNhbGxJZHNbc3B5Rm4uY2FsbENvdW50IC0gMV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgd2l0aEFyZ3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcmdzID0gc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5mYWtlcykge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IG1hdGNoaW5nRmFrZSh0aGlzLmZha2VzLCBhcmdzLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZha2VzID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgZmFrZSA9IHRoaXMuX2NyZWF0ZSgpO1xuICAgICAgICAgICAgZmFrZS5tYXRjaGluZ0FndW1lbnRzID0gYXJncztcbiAgICAgICAgICAgIGZha2UucGFyZW50ID0gdGhpcztcbiAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLmZha2VzLCBmYWtlKTtcblxuICAgICAgICAgICAgZmFrZS53aXRoQXJncyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3JpZ2luYWwud2l0aEFyZ3MuYXBwbHkob3JpZ2luYWwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChmYWtlLm1hdGNoZXModGhpcy5hcmdzW2ldKSkge1xuICAgICAgICAgICAgICAgICAgICBpbmNyZW1lbnRDYWxsQ291bnQuY2FsbChmYWtlKTtcbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKGZha2UudGhpc1ZhbHVlcywgdGhpcy50aGlzVmFsdWVzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKGZha2UuYXJncywgdGhpcy5hcmdzW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgcHVzaC5jYWxsKGZha2UucmV0dXJuVmFsdWVzLCB0aGlzLnJldHVyblZhbHVlc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIHB1c2guY2FsbChmYWtlLmV4Y2VwdGlvbnMsIHRoaXMuZXhjZXB0aW9uc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgIHB1c2guY2FsbChmYWtlLmNhbGxJZHMsIHRoaXMuY2FsbElkc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JlYXRlQ2FsbFByb3BlcnRpZXMuY2FsbChmYWtlKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZha2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbWF0Y2hlczogZnVuY3Rpb24gKGFyZ3MsIHN0cmljdCkge1xuICAgICAgICAgICAgdmFyIG1hcmdzID0gdGhpcy5tYXRjaGluZ0FndW1lbnRzO1xuXG4gICAgICAgICAgICBpZiAobWFyZ3MubGVuZ3RoIDw9IGFyZ3MubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgc2lub24uZGVlcEVxdWFsKG1hcmdzLCBhcmdzLnNsaWNlKDAsIG1hcmdzLmxlbmd0aCkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICFzdHJpY3QgfHwgbWFyZ3MubGVuZ3RoID09IGFyZ3MubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHByaW50ZjogZnVuY3Rpb24gKGZvcm1hdCkge1xuICAgICAgICAgICAgdmFyIHNweSA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgIHZhciBmb3JtYXR0ZXI7XG5cbiAgICAgICAgICAgIHJldHVybiAoZm9ybWF0IHx8IFwiXCIpLnJlcGxhY2UoLyUoLikvZywgZnVuY3Rpb24gKG1hdGNoLCBzcGVjaWZ5ZXIpIHtcbiAgICAgICAgICAgICAgICBmb3JtYXR0ZXIgPSBzcHlBcGkuZm9ybWF0dGVyc1tzcGVjaWZ5ZXJdO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXR0ZXIgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmb3JtYXR0ZXIuY2FsbChudWxsLCBzcHksIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWlzTmFOKHBhcnNlSW50KHNwZWNpZnllciwgMTApKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2lub24uZm9ybWF0KGFyZ3Nbc3BlY2lmeWVyIC0gMV0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBcIiVcIiArIHNwZWNpZnllcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGRlbGVnYXRlVG9DYWxscyhtZXRob2QsIG1hdGNoQW55LCBhY3R1YWwsIG5vdENhbGxlZCkge1xuICAgICAgICBzcHlBcGlbbWV0aG9kXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jYWxsZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAobm90Q2FsbGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBub3RDYWxsZWQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY3VycmVudENhbGw7XG4gICAgICAgICAgICB2YXIgbWF0Y2hlcyA9IDA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5jYWxsQ291bnQ7IGkgPCBsOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50Q2FsbCA9IHRoaXMuZ2V0Q2FsbChpKTtcblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Q2FsbFthY3R1YWwgfHwgbWV0aG9kXS5hcHBseShjdXJyZW50Q2FsbCwgYXJndW1lbnRzKSkge1xuICAgICAgICAgICAgICAgICAgICBtYXRjaGVzICs9IDE7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoQW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXMgPT09IHRoaXMuY2FsbENvdW50O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGRlbGVnYXRlVG9DYWxscyhcImNhbGxlZE9uXCIsIHRydWUpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImFsd2F5c0NhbGxlZE9uXCIsIGZhbHNlLCBcImNhbGxlZE9uXCIpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImNhbGxlZFdpdGhcIiwgdHJ1ZSk7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwiY2FsbGVkV2l0aE1hdGNoXCIsIHRydWUpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImFsd2F5c0NhbGxlZFdpdGhcIiwgZmFsc2UsIFwiY2FsbGVkV2l0aFwiKTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJhbHdheXNDYWxsZWRXaXRoTWF0Y2hcIiwgZmFsc2UsIFwiY2FsbGVkV2l0aE1hdGNoXCIpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImNhbGxlZFdpdGhFeGFjdGx5XCIsIHRydWUpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImFsd2F5c0NhbGxlZFdpdGhFeGFjdGx5XCIsIGZhbHNlLCBcImNhbGxlZFdpdGhFeGFjdGx5XCIpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcIm5ldmVyQ2FsbGVkV2l0aFwiLCBmYWxzZSwgXCJub3RDYWxsZWRXaXRoXCIsXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRydWU7IH0pO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcIm5ldmVyQ2FsbGVkV2l0aE1hdGNoXCIsIGZhbHNlLCBcIm5vdENhbGxlZFdpdGhNYXRjaFwiLFxuICAgICAgICBmdW5jdGlvbiAoKSB7IHJldHVybiB0cnVlOyB9KTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJ0aHJld1wiLCB0cnVlKTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJhbHdheXNUaHJld1wiLCBmYWxzZSwgXCJ0aHJld1wiKTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJyZXR1cm5lZFwiLCB0cnVlKTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJhbHdheXNSZXR1cm5lZFwiLCBmYWxzZSwgXCJyZXR1cm5lZFwiKTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJjYWxsZWRXaXRoTmV3XCIsIHRydWUpO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcImFsd2F5c0NhbGxlZFdpdGhOZXdcIiwgZmFsc2UsIFwiY2FsbGVkV2l0aE5ld1wiKTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJjYWxsQXJnXCIsIGZhbHNlLCBcImNhbGxBcmdXaXRoXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudG9TdHJpbmcoKSArIFwiIGNhbm5vdCBjYWxsIGFyZyBzaW5jZSBpdCB3YXMgbm90IHlldCBpbnZva2VkLlwiKTtcbiAgICB9KTtcbiAgICBzcHlBcGkuY2FsbEFyZ1dpdGggPSBzcHlBcGkuY2FsbEFyZztcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJjYWxsQXJnT25cIiwgZmFsc2UsIFwiY2FsbEFyZ09uV2l0aFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnRvU3RyaW5nKCkgKyBcIiBjYW5ub3QgY2FsbCBhcmcgc2luY2UgaXQgd2FzIG5vdCB5ZXQgaW52b2tlZC5cIik7XG4gICAgfSk7XG4gICAgc3B5QXBpLmNhbGxBcmdPbldpdGggPSBzcHlBcGkuY2FsbEFyZ09uO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcInlpZWxkXCIsIGZhbHNlLCBcInlpZWxkXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudG9TdHJpbmcoKSArIFwiIGNhbm5vdCB5aWVsZCBzaW5jZSBpdCB3YXMgbm90IHlldCBpbnZva2VkLlwiKTtcbiAgICB9KTtcbiAgICAvLyBcImludm9rZUNhbGxiYWNrXCIgaXMgYW4gYWxpYXMgZm9yIFwieWllbGRcIiBzaW5jZSBcInlpZWxkXCIgaXMgaW52YWxpZCBpbiBzdHJpY3QgbW9kZS5cbiAgICBzcHlBcGkuaW52b2tlQ2FsbGJhY2sgPSBzcHlBcGkueWllbGQ7XG4gICAgZGVsZWdhdGVUb0NhbGxzKFwieWllbGRPblwiLCBmYWxzZSwgXCJ5aWVsZE9uXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMudG9TdHJpbmcoKSArIFwiIGNhbm5vdCB5aWVsZCBzaW5jZSBpdCB3YXMgbm90IHlldCBpbnZva2VkLlwiKTtcbiAgICB9KTtcbiAgICBkZWxlZ2F0ZVRvQ2FsbHMoXCJ5aWVsZFRvXCIsIGZhbHNlLCBcInlpZWxkVG9cIiwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnRvU3RyaW5nKCkgKyBcIiBjYW5ub3QgeWllbGQgdG8gJ1wiICsgcHJvcGVydHkgK1xuICAgICAgICAgICAgXCInIHNpbmNlIGl0IHdhcyBub3QgeWV0IGludm9rZWQuXCIpO1xuICAgIH0pO1xuICAgIGRlbGVnYXRlVG9DYWxscyhcInlpZWxkVG9PblwiLCBmYWxzZSwgXCJ5aWVsZFRvT25cIiwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLnRvU3RyaW5nKCkgKyBcIiBjYW5ub3QgeWllbGQgdG8gJ1wiICsgcHJvcGVydHkgK1xuICAgICAgICAgICAgXCInIHNpbmNlIGl0IHdhcyBub3QgeWV0IGludm9rZWQuXCIpO1xuICAgIH0pO1xuXG4gICAgc3B5QXBpLmZvcm1hdHRlcnMgPSB7XG4gICAgICAgIFwiY1wiOiBmdW5jdGlvbiAoc3B5KSB7XG4gICAgICAgICAgICByZXR1cm4gc2lub24udGltZXNJbldvcmRzKHNweS5jYWxsQ291bnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIFwiblwiOiBmdW5jdGlvbiAoc3B5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3B5LnRvU3RyaW5nKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgXCJDXCI6IGZ1bmN0aW9uIChzcHkpIHtcbiAgICAgICAgICAgIHZhciBjYWxscyA9IFtdO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHNweS5jYWxsQ291bnQ7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RyaW5naWZpZWRDYWxsID0gXCIgICAgXCIgKyBzcHkuZ2V0Q2FsbChpKS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIGlmICgvXFxuLy50ZXN0KGNhbGxzW2kgLSAxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyaW5naWZpZWRDYWxsID0gXCJcXG5cIiArIHN0cmluZ2lmaWVkQ2FsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHVzaC5jYWxsKGNhbGxzLCBzdHJpbmdpZmllZENhbGwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2FsbHMubGVuZ3RoID4gMCA/IFwiXFxuXCIgKyBjYWxscy5qb2luKFwiXFxuXCIpIDogXCJcIjtcbiAgICAgICAgfSxcblxuICAgICAgICBcInRcIjogZnVuY3Rpb24gKHNweSkge1xuICAgICAgICAgICAgdmFyIG9iamVjdHMgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzcHkuY2FsbENvdW50OyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgcHVzaC5jYWxsKG9iamVjdHMsIHNpbm9uLmZvcm1hdChzcHkudGhpc1ZhbHVlc1tpXSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0cy5qb2luKFwiLCBcIik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgXCIqXCI6IGZ1bmN0aW9uIChzcHksIGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBmb3JtYXR0ZWQgPSBbXTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmdzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgICAgIHB1c2guY2FsbChmb3JtYXR0ZWQsIHNpbm9uLmZvcm1hdChhcmdzW2ldKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBmb3JtYXR0ZWQuam9pbihcIiwgXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNpbm9uLmV4dGVuZChzcHksIHNweUFwaSk7XG5cbiAgICBzcHkuc3B5Q2FsbCA9IHNpbm9uLnNweUNhbGw7XG5cbiAgICBpZiAoY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBzcHk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2lub24uc3B5ID0gc3B5O1xuICAgIH1cbn0odHlwZW9mIHNpbm9uID09IFwib2JqZWN0XCIgJiYgc2lub24gfHwgbnVsbCkpO1xuIiwiLyoqXG4gKiBAZGVwZW5kIC4uL3Npbm9uLmpzXG4gKiBAZGVwZW5kIHNweS5qc1xuICogQGRlcGVuZCBiZWhhdmlvci5qc1xuICovXG4vKmpzbGludCBlcWVxZXE6IGZhbHNlLCBvbmV2YXI6IGZhbHNlKi9cbi8qZ2xvYmFsIG1vZHVsZSwgcmVxdWlyZSwgc2lub24qL1xuLyoqXG4gKiBTdHViIGZ1bmN0aW9uc1xuICpcbiAqIEBhdXRob3IgQ2hyaXN0aWFuIEpvaGFuc2VuIChjaHJpc3RpYW5AY2pvaGFuc2VuLm5vKVxuICogQGxpY2Vuc2UgQlNEXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLTIwMTMgQ2hyaXN0aWFuIEpvaGFuc2VuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG4oZnVuY3Rpb24gKHNpbm9uKSB7XG4gICAgdmFyIGNvbW1vbkpTTW9kdWxlID0gdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHM7XG5cbiAgICBpZiAoIXNpbm9uICYmIGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIHNpbm9uID0gcmVxdWlyZShcIi4uL3Npbm9uXCIpO1xuICAgIH1cblxuICAgIGlmICghc2lub24pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0dWIob2JqZWN0LCBwcm9wZXJ0eSwgZnVuYykge1xuICAgICAgICBpZiAoISFmdW5jICYmIHR5cGVvZiBmdW5jICE9IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkN1c3RvbSBzdHViIHNob3VsZCBiZSBmdW5jdGlvblwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3cmFwcGVyO1xuXG4gICAgICAgIGlmIChmdW5jKSB7XG4gICAgICAgICAgICB3cmFwcGVyID0gc2lub24uc3B5ICYmIHNpbm9uLnNweS5jcmVhdGUgPyBzaW5vbi5zcHkuY3JlYXRlKGZ1bmMpIDogZnVuYztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdyYXBwZXIgPSBzdHViLmNyZWF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFvYmplY3QgJiYgdHlwZW9mIHByb3BlcnR5ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gc2lub24uc3R1Yi5jcmVhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgcHJvcGVydHkgPT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIG9iamVjdCA9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIG9iamVjdCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0W3Byb3BdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3R1YihvYmplY3QsIHByb3ApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzaW5vbi53cmFwTWV0aG9kKG9iamVjdCwgcHJvcGVydHksIHdyYXBwZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldERlZmF1bHRCZWhhdmlvcihzdHViKSB7XG4gICAgICAgIHJldHVybiBzdHViLmRlZmF1bHRCZWhhdmlvciB8fCBnZXRQYXJlbnRCZWhhdmlvdXIoc3R1YikgfHwgc2lub24uYmVoYXZpb3IuY3JlYXRlKHN0dWIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFBhcmVudEJlaGF2aW91cihzdHViKSB7XG4gICAgICAgIHJldHVybiAoc3R1Yi5wYXJlbnQgJiYgZ2V0Q3VycmVudEJlaGF2aW9yKHN0dWIucGFyZW50KSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q3VycmVudEJlaGF2aW9yKHN0dWIpIHtcbiAgICAgICAgdmFyIGJlaGF2aW9yID0gc3R1Yi5iZWhhdmlvcnNbc3R1Yi5jYWxsQ291bnQgLSAxXTtcbiAgICAgICAgcmV0dXJuIGJlaGF2aW9yICYmIGJlaGF2aW9yLmlzUHJlc2VudCgpID8gYmVoYXZpb3IgOiBnZXREZWZhdWx0QmVoYXZpb3Ioc3R1Yik7XG4gICAgfVxuXG4gICAgdmFyIHV1aWQgPSAwO1xuXG4gICAgc2lub24uZXh0ZW5kKHN0dWIsIChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcm90byA9IHtcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gY3JlYXRlKCkge1xuICAgICAgICAgICAgICAgIHZhciBmdW5jdGlvblN0dWIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRDdXJyZW50QmVoYXZpb3IoZnVuY3Rpb25TdHViKS5pbnZva2UodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb25TdHViLmlkID0gXCJzdHViI1wiICsgdXVpZCsrO1xuICAgICAgICAgICAgICAgIHZhciBvcmlnID0gZnVuY3Rpb25TdHViO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uU3R1YiA9IHNpbm9uLnNweS5jcmVhdGUoZnVuY3Rpb25TdHViKTtcbiAgICAgICAgICAgICAgICBmdW5jdGlvblN0dWIuZnVuYyA9IG9yaWc7XG5cbiAgICAgICAgICAgICAgICBzaW5vbi5leHRlbmQoZnVuY3Rpb25TdHViLCBzdHViKTtcbiAgICAgICAgICAgICAgICBmdW5jdGlvblN0dWIuX2NyZWF0ZSA9IHNpbm9uLnN0dWIuY3JlYXRlO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uU3R1Yi5kaXNwbGF5TmFtZSA9IFwic3R1YlwiO1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uU3R1Yi50b1N0cmluZyA9IHNpbm9uLmZ1bmN0aW9uVG9TdHJpbmc7XG5cbiAgICAgICAgICAgICAgICBmdW5jdGlvblN0dWIuZGVmYXVsdEJlaGF2aW9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICBmdW5jdGlvblN0dWIuYmVoYXZpb3JzID0gW107XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb25TdHViO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzZXRCZWhhdmlvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0QmVoYXZpb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuYmVoYXZpb3JzID0gW107XG5cbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5yZXR1cm5WYWx1ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5yZXR1cm5BcmdBdDtcbiAgICAgICAgICAgICAgICB0aGlzLnJldHVyblRoaXMgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZha2VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLmZha2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZha2VzW2ldLnJlc2V0QmVoYXZpb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uQ2FsbDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYmVoYXZpb3JzW2luZGV4XSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJlaGF2aW9yc1tpbmRleF0gPSBzaW5vbi5iZWhhdmlvci5jcmVhdGUodGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmVoYXZpb3JzW2luZGV4XTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uRmlyc3RDYWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vbkNhbGwoMCk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBvblNlY29uZENhbGw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm9uQ2FsbCgxKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIG9uVGhpcmRDYWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vbkNhbGwoMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yICh2YXIgbWV0aG9kIGluIHNpbm9uLmJlaGF2aW9yKSB7XG4gICAgICAgICAgICBpZiAoc2lub24uYmVoYXZpb3IuaGFzT3duUHJvcGVydHkobWV0aG9kKSAmJlxuICAgICAgICAgICAgICAgICFwcm90by5oYXNPd25Qcm9wZXJ0eShtZXRob2QpICYmXG4gICAgICAgICAgICAgICAgbWV0aG9kICE9ICdjcmVhdGUnICYmXG4gICAgICAgICAgICAgICAgbWV0aG9kICE9ICd3aXRoQXJncycgJiZcbiAgICAgICAgICAgICAgICBtZXRob2QgIT0gJ2ludm9rZScpIHtcbiAgICAgICAgICAgICAgICBwcm90b1ttZXRob2RdID0gKGZ1bmN0aW9uKGJlaGF2aW9yTWV0aG9kKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdEJlaGF2aW9yID0gdGhpcy5kZWZhdWx0QmVoYXZpb3IgfHwgc2lub24uYmVoYXZpb3IuY3JlYXRlKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0QmVoYXZpb3JbYmVoYXZpb3JNZXRob2RdLmFwcGx5KHRoaXMuZGVmYXVsdEJlaGF2aW9yLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfShtZXRob2QpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm90bztcbiAgICB9KCkpKTtcblxuICAgIGlmIChjb21tb25KU01vZHVsZSkge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHN0dWI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2lub24uc3R1YiA9IHN0dWI7XG4gICAgfVxufSh0eXBlb2Ygc2lub24gPT0gXCJvYmplY3RcIiAmJiBzaW5vbiB8fCBudWxsKSk7XG4iLCIvKipcbiAqIEBkZXBlbmQgLi4vc2lub24uanNcbiAqIEBkZXBlbmQgc3R1Yi5qc1xuICogQGRlcGVuZCBtb2NrLmpzXG4gKiBAZGVwZW5kIHNhbmRib3guanNcbiAqL1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgb25ldmFyOiBmYWxzZSwgZm9yaW46IHRydWUsIHBsdXNwbHVzOiBmYWxzZSovXG4vKmdsb2JhbCBtb2R1bGUsIHJlcXVpcmUsIHNpbm9uKi9cbi8qKlxuICogVGVzdCBmdW5jdGlvbiwgc2FuZGJveGVzIGZha2VzXG4gKlxuICogQGF1dGhvciBDaHJpc3RpYW4gSm9oYW5zZW4gKGNocmlzdGlhbkBjam9oYW5zZW4ubm8pXG4gKiBAbGljZW5zZSBCU0RcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBDaHJpc3RpYW4gSm9oYW5zZW5cbiAqL1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbihmdW5jdGlvbiAoc2lub24pIHtcbiAgICB2YXIgY29tbW9uSlNNb2R1bGUgPSB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cztcblxuICAgIGlmICghc2lub24gJiYgY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgc2lub24gPSByZXF1aXJlKFwiLi4vc2lub25cIik7XG4gICAgfVxuXG4gICAgaWYgKCFzaW5vbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVzdChjYWxsYmFjaykge1xuICAgICAgICB2YXIgdHlwZSA9IHR5cGVvZiBjYWxsYmFjaztcblxuICAgICAgICBpZiAodHlwZSAhPSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJzaW5vbi50ZXN0IG5lZWRzIHRvIHdyYXAgYSB0ZXN0IGZ1bmN0aW9uLCBnb3QgXCIgKyB0eXBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29uZmlnID0gc2lub24uZ2V0Q29uZmlnKHNpbm9uLmNvbmZpZyk7XG4gICAgICAgICAgICBjb25maWcuaW5qZWN0SW50byA9IGNvbmZpZy5pbmplY3RJbnRvVGhpcyAmJiB0aGlzIHx8IGNvbmZpZy5pbmplY3RJbnRvO1xuICAgICAgICAgICAgdmFyIHNhbmRib3ggPSBzaW5vbi5zYW5kYm94LmNyZWF0ZShjb25maWcpO1xuICAgICAgICAgICAgdmFyIGV4Y2VwdGlvbiwgcmVzdWx0O1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLmNvbmNhdChzYW5kYm94LmFyZ3MpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhjZXB0aW9uICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgc2FuZGJveC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2FuZGJveC52ZXJpZnlBbmRSZXN0b3JlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdGVzdC5jb25maWcgPSB7XG4gICAgICAgIGluamVjdEludG9UaGlzOiB0cnVlLFxuICAgICAgICBpbmplY3RJbnRvOiBudWxsLFxuICAgICAgICBwcm9wZXJ0aWVzOiBbXCJzcHlcIiwgXCJzdHViXCIsIFwibW9ja1wiLCBcImNsb2NrXCIsIFwic2VydmVyXCIsIFwicmVxdWVzdHNcIl0sXG4gICAgICAgIHVzZUZha2VUaW1lcnM6IHRydWUsXG4gICAgICAgIHVzZUZha2VTZXJ2ZXI6IHRydWVcbiAgICB9O1xuXG4gICAgaWYgKGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gdGVzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi50ZXN0ID0gdGVzdDtcbiAgICB9XG59KHR5cGVvZiBzaW5vbiA9PSBcIm9iamVjdFwiICYmIHNpbm9uIHx8IG51bGwpKTtcbiIsIi8qKlxuICogQGRlcGVuZCAuLi9zaW5vbi5qc1xuICogQGRlcGVuZCB0ZXN0LmpzXG4gKi9cbi8qanNsaW50IGVxZXFlcTogZmFsc2UsIG9uZXZhcjogZmFsc2UsIGVxZXFlcTogZmFsc2UqL1xuLypnbG9iYWwgbW9kdWxlLCByZXF1aXJlLCBzaW5vbiovXG4vKipcbiAqIFRlc3QgY2FzZSwgc2FuZGJveGVzIGFsbCB0ZXN0IGZ1bmN0aW9uc1xuICpcbiAqIEBhdXRob3IgQ2hyaXN0aWFuIEpvaGFuc2VuIChjaHJpc3RpYW5AY2pvaGFuc2VuLm5vKVxuICogQGxpY2Vuc2UgQlNEXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLTIwMTMgQ2hyaXN0aWFuIEpvaGFuc2VuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG4oZnVuY3Rpb24gKHNpbm9uKSB7XG4gICAgdmFyIGNvbW1vbkpTTW9kdWxlID0gdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHM7XG5cbiAgICBpZiAoIXNpbm9uICYmIGNvbW1vbkpTTW9kdWxlKSB7XG4gICAgICAgIHNpbm9uID0gcmVxdWlyZShcIi4uL3Npbm9uXCIpO1xuICAgIH1cblxuICAgIGlmICghc2lub24gfHwgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVRlc3QocHJvcGVydHksIHNldFVwLCB0ZWFyRG93bikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHNldFVwKSB7XG4gICAgICAgICAgICAgICAgc2V0VXAuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGV4Y2VwdGlvbiwgcmVzdWx0O1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHByb3BlcnR5LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRlYXJEb3duKSB7XG4gICAgICAgICAgICAgICAgdGVhckRvd24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZXN0Q2FzZSh0ZXN0cywgcHJlZml4KSB7XG4gICAgICAgIC8qanNsOmlnbm9yZSovXG4gICAgICAgIGlmICghdGVzdHMgfHwgdHlwZW9mIHRlc3RzICE9IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJzaW5vbi50ZXN0Q2FzZSBuZWVkcyBhbiBvYmplY3Qgd2l0aCB0ZXN0IGZ1bmN0aW9uc1wiKTtcbiAgICAgICAgfVxuICAgICAgICAvKmpzbDplbmQqL1xuXG4gICAgICAgIHByZWZpeCA9IHByZWZpeCB8fCBcInRlc3RcIjtcbiAgICAgICAgdmFyIHJQcmVmaXggPSBuZXcgUmVnRXhwKFwiXlwiICsgcHJlZml4KTtcbiAgICAgICAgdmFyIG1ldGhvZHMgPSB7fSwgdGVzdE5hbWUsIHByb3BlcnR5LCBtZXRob2Q7XG4gICAgICAgIHZhciBzZXRVcCA9IHRlc3RzLnNldFVwO1xuICAgICAgICB2YXIgdGVhckRvd24gPSB0ZXN0cy50ZWFyRG93bjtcblxuICAgICAgICBmb3IgKHRlc3ROYW1lIGluIHRlc3RzKSB7XG4gICAgICAgICAgICBpZiAodGVzdHMuaGFzT3duUHJvcGVydHkodGVzdE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHkgPSB0ZXN0c1t0ZXN0TmFtZV07XG5cbiAgICAgICAgICAgICAgICBpZiAoL14oc2V0VXB8dGVhckRvd24pJC8udGVzdCh0ZXN0TmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwcm9wZXJ0eSA9PSBcImZ1bmN0aW9uXCIgJiYgclByZWZpeC50ZXN0KHRlc3ROYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSBwcm9wZXJ0eTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoc2V0VXAgfHwgdGVhckRvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9IGNyZWF0ZVRlc3QocHJvcGVydHksIHNldFVwLCB0ZWFyRG93bik7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBtZXRob2RzW3Rlc3ROYW1lXSA9IHNpbm9uLnRlc3QobWV0aG9kKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2RzW3Rlc3ROYW1lXSA9IHRlc3RzW3Rlc3ROYW1lXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWV0aG9kcztcbiAgICB9XG5cbiAgICBpZiAoY29tbW9uSlNNb2R1bGUpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB0ZXN0Q2FzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaW5vbi50ZXN0Q2FzZSA9IHRlc3RDYXNlO1xuICAgIH1cbn0odHlwZW9mIHNpbm9uID09IFwib2JqZWN0XCIgJiYgc2lub24gfHwgbnVsbCkpO1xuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLypqc2xpbnQgZXFlcWVxOiBmYWxzZSwgcGx1c3BsdXM6IGZhbHNlLCBldmlsOiB0cnVlLCBvbmV2YXI6IGZhbHNlLCBicm93c2VyOiB0cnVlLCBmb3JpbjogZmFsc2UqL1xuLypnbG9iYWwgbW9kdWxlLCByZXF1aXJlLCB3aW5kb3cqL1xuLyoqXG4gKiBGYWtlIHRpbWVyIEFQSVxuICogc2V0VGltZW91dFxuICogc2V0SW50ZXJ2YWxcbiAqIGNsZWFyVGltZW91dFxuICogY2xlYXJJbnRlcnZhbFxuICogdGlja1xuICogcmVzZXRcbiAqIERhdGVcbiAqXG4gKiBJbnNwaXJlZCBieSBqc1VuaXRNb2NrVGltZU91dCBmcm9tIEpzVW5pdFxuICpcbiAqIEBhdXRob3IgQ2hyaXN0aWFuIEpvaGFuc2VuIChjaHJpc3RpYW5AY2pvaGFuc2VuLm5vKVxuICogQGxpY2Vuc2UgQlNEXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEwLTIwMTMgQ2hyaXN0aWFuIEpvaGFuc2VuXG4gKi9cblwidXNlIHN0cmljdFwiO1xuXG5pZiAodHlwZW9mIHNpbm9uID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB2YXIgc2lub24gPSB7fTtcbn1cblxuKGZ1bmN0aW9uIChnbG9iYWwpIHtcbiAgICB2YXIgaWQgPSAxO1xuXG4gICAgZnVuY3Rpb24gYWRkVGltZXIoYXJncywgcmVjdXJyaW5nKSB7XG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRnVuY3Rpb24gcmVxdWlyZXMgYXQgbGVhc3QgMSBwYXJhbWV0ZXJcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbGxiYWNrIG11c3QgYmUgcHJvdmlkZWQgdG8gdGltZXIgY2FsbHNcIik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9JZCA9IGlkKys7XG4gICAgICAgIHZhciBkZWxheSA9IGFyZ3NbMV0gfHwgMDtcblxuICAgICAgICBpZiAoIXRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dHMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGltZW91dHNbdG9JZF0gPSB7XG4gICAgICAgICAgICBpZDogdG9JZCxcbiAgICAgICAgICAgIGZ1bmM6IGFyZ3NbMF0sXG4gICAgICAgICAgICBjYWxsQXQ6IHRoaXMubm93ICsgZGVsYXksXG4gICAgICAgICAgICBpbnZva2VBcmdzOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmdzLCAyKVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChyZWN1cnJpbmcgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dHNbdG9JZF0uaW50ZXJ2YWwgPSBkZWxheTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0b0lkO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlVGltZShzdHIpIHtcbiAgICAgICAgaWYgKCFzdHIpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0cmluZ3MgPSBzdHIuc3BsaXQoXCI6XCIpO1xuICAgICAgICB2YXIgbCA9IHN0cmluZ3MubGVuZ3RoLCBpID0gbDtcbiAgICAgICAgdmFyIG1zID0gMCwgcGFyc2VkO1xuXG4gICAgICAgIGlmIChsID4gMyB8fCAhL14oXFxkXFxkOil7MCwyfVxcZFxcZD8kLy50ZXN0KHN0cikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRpY2sgb25seSB1bmRlcnN0YW5kcyBudW1iZXJzIGFuZCAnaDptOnMnXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nc1tpXSwgMTApO1xuXG4gICAgICAgICAgICBpZiAocGFyc2VkID49IDYwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0aW1lIFwiICsgc3RyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbXMgKz0gcGFyc2VkICogTWF0aC5wb3coNjAsIChsIC0gaSAtIDEpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBtcyAqIDEwMDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlT2JqZWN0KG9iamVjdCkge1xuICAgICAgICB2YXIgbmV3T2JqZWN0O1xuXG4gICAgICAgIGlmIChPYmplY3QuY3JlYXRlKSB7XG4gICAgICAgICAgICBuZXdPYmplY3QgPSBPYmplY3QuY3JlYXRlKG9iamVjdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgRi5wcm90b3R5cGUgPSBvYmplY3Q7XG4gICAgICAgICAgICBuZXdPYmplY3QgPSBuZXcgRigpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3T2JqZWN0LkRhdGUuY2xvY2sgPSBuZXdPYmplY3Q7XG4gICAgICAgIHJldHVybiBuZXdPYmplY3Q7XG4gICAgfVxuXG4gICAgc2lub24uY2xvY2sgPSB7XG4gICAgICAgIG5vdzogMCxcblxuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIGNyZWF0ZShub3cpIHtcbiAgICAgICAgICAgIHZhciBjbG9jayA9IGNyZWF0ZU9iamVjdCh0aGlzKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBub3cgPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIGNsb2NrLm5vdyA9IG5vdztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCEhbm93ICYmIHR5cGVvZiBub3cgPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJub3cgc2hvdWxkIGJlIG1pbGxpc2Vjb25kcyBzaW5jZSBVTklYIGVwb2NoXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY2xvY2s7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0VGltZW91dDogZnVuY3Rpb24gc2V0VGltZW91dChjYWxsYmFjaywgdGltZW91dCkge1xuICAgICAgICAgICAgcmV0dXJuIGFkZFRpbWVyLmNhbGwodGhpcywgYXJndW1lbnRzLCBmYWxzZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJUaW1lb3V0OiBmdW5jdGlvbiBjbGVhclRpbWVvdXQodGltZXJJZCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0cyA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGltZXJJZCBpbiB0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudGltZW91dHNbdGltZXJJZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0SW50ZXJ2YWw6IGZ1bmN0aW9uIHNldEludGVydmFsKGNhbGxiYWNrLCB0aW1lb3V0KSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkVGltZXIuY2FsbCh0aGlzLCBhcmd1bWVudHMsIHRydWUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsZWFySW50ZXJ2YWw6IGZ1bmN0aW9uIGNsZWFySW50ZXJ2YWwodGltZXJJZCkge1xuICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXQodGltZXJJZCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0SW1tZWRpYXRlOiBmdW5jdGlvbiBzZXRJbW1lZGlhdGUoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciBwYXNzVGhydUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgICAgICAgICByZXR1cm4gYWRkVGltZXIuY2FsbCh0aGlzLCBbY2FsbGJhY2ssIDBdLmNvbmNhdChwYXNzVGhydUFyZ3MpLCBmYWxzZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xlYXJJbW1lZGlhdGU6IGZ1bmN0aW9uIGNsZWFySW1tZWRpYXRlKHRpbWVySWQpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0KHRpbWVySWQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRpY2s6IGZ1bmN0aW9uIHRpY2sobXMpIHtcbiAgICAgICAgICAgIG1zID0gdHlwZW9mIG1zID09IFwibnVtYmVyXCIgPyBtcyA6IHBhcnNlVGltZShtcyk7XG4gICAgICAgICAgICB2YXIgdGlja0Zyb20gPSB0aGlzLm5vdywgdGlja1RvID0gdGhpcy5ub3cgKyBtcywgcHJldmlvdXMgPSB0aGlzLm5vdztcbiAgICAgICAgICAgIHZhciB0aW1lciA9IHRoaXMuZmlyc3RUaW1lckluUmFuZ2UodGlja0Zyb20sIHRpY2tUbyk7XG5cbiAgICAgICAgICAgIHZhciBmaXJzdEV4Y2VwdGlvbjtcbiAgICAgICAgICAgIHdoaWxlICh0aW1lciAmJiB0aWNrRnJvbSA8PSB0aWNrVG8pIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0c1t0aW1lci5pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgdGlja0Zyb20gPSB0aGlzLm5vdyA9IHRpbWVyLmNhbGxBdDtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxUaW1lcih0aW1lcik7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICBmaXJzdEV4Y2VwdGlvbiA9IGZpcnN0RXhjZXB0aW9uIHx8IGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aW1lciA9IHRoaXMuZmlyc3RUaW1lckluUmFuZ2UocHJldmlvdXMsIHRpY2tUbyk7XG4gICAgICAgICAgICAgICAgcHJldmlvdXMgPSB0aWNrRnJvbTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5ub3cgPSB0aWNrVG87XG5cbiAgICAgICAgICAgIGlmIChmaXJzdEV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICB0aHJvdyBmaXJzdEV4Y2VwdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubm93O1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpcnN0VGltZXJJblJhbmdlOiBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcbiAgICAgICAgICAgIHZhciB0aW1lciwgc21hbGxlc3QgPSBudWxsLCBvcmlnaW5hbFRpbWVyO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dHMuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXRzW2lkXS5jYWxsQXQgPCBmcm9tIHx8IHRoaXMudGltZW91dHNbaWRdLmNhbGxBdCA+IHRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzbWFsbGVzdCA9PT0gbnVsbCB8fCB0aGlzLnRpbWVvdXRzW2lkXS5jYWxsQXQgPCBzbWFsbGVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxUaW1lciA9IHRoaXMudGltZW91dHNbaWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgc21hbGxlc3QgPSB0aGlzLnRpbWVvdXRzW2lkXS5jYWxsQXQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmM6IHRoaXMudGltZW91dHNbaWRdLmZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbEF0OiB0aGlzLnRpbWVvdXRzW2lkXS5jYWxsQXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJ2YWw6IHRoaXMudGltZW91dHNbaWRdLmludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzLnRpbWVvdXRzW2lkXS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZva2VBcmdzOiB0aGlzLnRpbWVvdXRzW2lkXS5pbnZva2VBcmdzXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGltZXIgfHwgbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBjYWxsVGltZXI6IGZ1bmN0aW9uICh0aW1lcikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aW1lci5pbnRlcnZhbCA9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50aW1lb3V0c1t0aW1lci5pZF0uY2FsbEF0ICs9IHRpbWVyLmludGVydmFsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50aW1lb3V0c1t0aW1lci5pZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aW1lci5mdW5jID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB0aW1lci5mdW5jLmFwcGx5KG51bGwsIHRpbWVyLmludm9rZUFyZ3MpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV2YWwodGltZXIuZnVuYyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICB2YXIgZXhjZXB0aW9uID0gZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0aGlzLnRpbWVvdXRzW3RpbWVyLmlkXSkge1xuICAgICAgICAgICAgICAgIGlmIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgIHRocm93IGV4Y2VwdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICByZXNldDogZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgICAgICB0aGlzLnRpbWVvdXRzID0ge307XG4gICAgICAgIH0sXG5cbiAgICAgICAgRGF0ZTogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBOYXRpdmVEYXRlID0gRGF0ZTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gQ2xvY2tEYXRlKHllYXIsIG1vbnRoLCBkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCwgbXMpIHtcbiAgICAgICAgICAgICAgICAvLyBEZWZlbnNpdmUgYW5kIHZlcmJvc2UgdG8gYXZvaWQgcG90ZW50aWFsIGhhcm0gaW4gcGFzc2luZ1xuICAgICAgICAgICAgICAgIC8vIGV4cGxpY2l0IHVuZGVmaW5lZCB3aGVuIHVzZXIgZG9lcyBub3QgcGFzcyBhcmd1bWVudFxuICAgICAgICAgICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVEYXRlKENsb2NrRGF0ZS5jbG9jay5ub3cpO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVEYXRlKHllYXIpO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVEYXRlKHllYXIsIG1vbnRoKTtcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgTmF0aXZlRGF0ZSh5ZWFyLCBtb250aCwgZGF0ZSk7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IE5hdGl2ZURhdGUoeWVhciwgbW9udGgsIGRhdGUsIGhvdXIpO1xuICAgICAgICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVEYXRlKHllYXIsIG1vbnRoLCBkYXRlLCBob3VyLCBtaW51dGUpO1xuICAgICAgICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVEYXRlKHllYXIsIG1vbnRoLCBkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCk7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBOYXRpdmVEYXRlKHllYXIsIG1vbnRoLCBkYXRlLCBob3VyLCBtaW51dGUsIHNlY29uZCwgbXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG1pcnJvckRhdGVQcm9wZXJ0aWVzKENsb2NrRGF0ZSwgTmF0aXZlRGF0ZSk7XG4gICAgICAgIH0oKSlcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gbWlycm9yRGF0ZVByb3BlcnRpZXModGFyZ2V0LCBzb3VyY2UpIHtcbiAgICAgICAgaWYgKHNvdXJjZS5ub3cpIHtcbiAgICAgICAgICAgIHRhcmdldC5ub3cgPSBmdW5jdGlvbiBub3coKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5jbG9jay5ub3c7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRhcmdldC5ub3c7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc291cmNlLnRvU291cmNlKSB7XG4gICAgICAgICAgICB0YXJnZXQudG9Tb3VyY2UgPSBmdW5jdGlvbiB0b1NvdXJjZSgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc291cmNlLnRvU291cmNlKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRhcmdldC50b1NvdXJjZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRhcmdldC50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNvdXJjZS50b1N0cmluZygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRhcmdldC5wcm90b3R5cGUgPSBzb3VyY2UucHJvdG90eXBlO1xuICAgICAgICB0YXJnZXQucGFyc2UgPSBzb3VyY2UucGFyc2U7XG4gICAgICAgIHRhcmdldC5VVEMgPSBzb3VyY2UuVVRDO1xuICAgICAgICB0YXJnZXQucHJvdG90eXBlLnRvVVRDU3RyaW5nID0gc291cmNlLnByb3RvdHlwZS50b1VUQ1N0cmluZztcblxuICAgICAgICBmb3IgKHZhciBwcm9wIGluIHNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgICAgIHRhcmdldFtwcm9wXSA9IHNvdXJjZVtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfVxuXG4gICAgdmFyIG1ldGhvZHMgPSBbXCJEYXRlXCIsIFwic2V0VGltZW91dFwiLCBcInNldEludGVydmFsXCIsXG4gICAgICAgICAgICAgICAgICAgXCJjbGVhclRpbWVvdXRcIiwgXCJjbGVhckludGVydmFsXCJdO1xuXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwuc2V0SW1tZWRpYXRlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIG1ldGhvZHMucHVzaChcInNldEltbWVkaWF0ZVwiKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGdsb2JhbC5jbGVhckltbWVkaWF0ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBtZXRob2RzLnB1c2goXCJjbGVhckltbWVkaWF0ZVwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZXN0b3JlKCkge1xuICAgICAgICB2YXIgbWV0aG9kO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5tZXRob2RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgbWV0aG9kID0gdGhpcy5tZXRob2RzW2ldO1xuXG4gICAgICAgICAgICBpZiAoZ2xvYmFsW21ldGhvZF0uaGFkT3duUHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICBnbG9iYWxbbWV0aG9kXSA9IHRoaXNbXCJfXCIgKyBtZXRob2RdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsW21ldGhvZF07XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgbXVsdGlwbGUgZXhlY3V0aW9ucyB3aGljaCB3aWxsIGNvbXBsZXRlbHkgcmVtb3ZlIHRoZXNlIHByb3BzXG4gICAgICAgIHRoaXMubWV0aG9kcyA9IFtdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0dWJHbG9iYWwobWV0aG9kLCBjbG9jaykge1xuICAgICAgICBjbG9ja1ttZXRob2RdLmhhZE93blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGdsb2JhbCwgbWV0aG9kKTtcbiAgICAgICAgY2xvY2tbXCJfXCIgKyBtZXRob2RdID0gZ2xvYmFsW21ldGhvZF07XG5cbiAgICAgICAgaWYgKG1ldGhvZCA9PSBcIkRhdGVcIikge1xuICAgICAgICAgICAgdmFyIGRhdGUgPSBtaXJyb3JEYXRlUHJvcGVydGllcyhjbG9ja1ttZXRob2RdLCBnbG9iYWxbbWV0aG9kXSk7XG4gICAgICAgICAgICBnbG9iYWxbbWV0aG9kXSA9IGRhdGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnbG9iYWxbbWV0aG9kXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2xvY2tbbWV0aG9kXS5hcHBseShjbG9jaywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAodmFyIHByb3AgaW4gY2xvY2tbbWV0aG9kXSkge1xuICAgICAgICAgICAgICAgIGlmIChjbG9ja1ttZXRob2RdLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbFttZXRob2RdW3Byb3BdID0gY2xvY2tbbWV0aG9kXVtwcm9wXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnbG9iYWxbbWV0aG9kXS5jbG9jayA9IGNsb2NrO1xuICAgIH1cblxuICAgIHNpbm9uLnVzZUZha2VUaW1lcnMgPSBmdW5jdGlvbiB1c2VGYWtlVGltZXJzKG5vdykge1xuICAgICAgICB2YXIgY2xvY2sgPSBzaW5vbi5jbG9jay5jcmVhdGUobm93KTtcbiAgICAgICAgY2xvY2sucmVzdG9yZSA9IHJlc3RvcmU7XG4gICAgICAgIGNsb2NrLm1ldGhvZHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2Ygbm93ID09IFwibnVtYmVyXCIgPyAxIDogMCk7XG5cbiAgICAgICAgaWYgKGNsb2NrLm1ldGhvZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjbG9jay5tZXRob2RzID0gbWV0aG9kcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2xvY2subWV0aG9kcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHN0dWJHbG9iYWwoY2xvY2subWV0aG9kc1tpXSwgY2xvY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNsb2NrO1xuICAgIH07XG59KHR5cGVvZiBnbG9iYWwgIT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgZ2xvYmFsICE9PSBcImZ1bmN0aW9uXCIgPyBnbG9iYWwgOiB0aGlzKSk7XG5cbnNpbm9uLnRpbWVycyA9IHtcbiAgICBzZXRUaW1lb3V0OiBzZXRUaW1lb3V0LFxuICAgIGNsZWFyVGltZW91dDogY2xlYXJUaW1lb3V0LFxuICAgIHNldEltbWVkaWF0ZTogKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09IFwidW5kZWZpbmVkXCIgPyBzZXRJbW1lZGlhdGUgOiB1bmRlZmluZWQpLFxuICAgIGNsZWFySW1tZWRpYXRlOiAodHlwZW9mIGNsZWFySW1tZWRpYXRlICE9PSBcInVuZGVmaW5lZFwiID8gY2xlYXJJbW1lZGlhdGU6IHVuZGVmaW5lZCksXG4gICAgc2V0SW50ZXJ2YWw6IHNldEludGVydmFsLFxuICAgIGNsZWFySW50ZXJ2YWw6IGNsZWFySW50ZXJ2YWwsXG4gICAgRGF0ZTogRGF0ZVxufTtcblxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzaW5vbjtcbn1cblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4oKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kICYmIGZ1bmN0aW9uIChtKSB7XG4gICAgZGVmaW5lKFwiZm9ybWF0aW9cIiwgW1wic2Ftc2FtXCJdLCBtKTtcbn0pIHx8ICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIGZ1bmN0aW9uIChtKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtKHJlcXVpcmUoXCJzYW1zYW1cIikpO1xufSkgfHwgZnVuY3Rpb24gKG0pIHsgdGhpcy5mb3JtYXRpbyA9IG0odGhpcy5zYW1zYW0pOyB9XG4pKGZ1bmN0aW9uIChzYW1zYW0pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIHZhciBmb3JtYXRpbyA9IHtcbiAgICAgICAgZXhjbHVkZUNvbnN0cnVjdG9yczogW1wiT2JqZWN0XCIsIC9eLiQvXSxcbiAgICAgICAgcXVvdGVTdHJpbmdzOiB0cnVlXG4gICAgfTtcblxuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4gICAgdmFyIHNwZWNpYWxPYmplY3RzID0gW107XG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc3BlY2lhbE9iamVjdHMucHVzaCh7IG9iamVjdDogZ2xvYmFsLCB2YWx1ZTogXCJbb2JqZWN0IGdsb2JhbF1cIiB9KTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBzcGVjaWFsT2JqZWN0cy5wdXNoKHtcbiAgICAgICAgICAgIG9iamVjdDogZG9jdW1lbnQsXG4gICAgICAgICAgICB2YWx1ZTogXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc3BlY2lhbE9iamVjdHMucHVzaCh7IG9iamVjdDogd2luZG93LCB2YWx1ZTogXCJbb2JqZWN0IFdpbmRvd11cIiB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmdW5jdGlvbk5hbWUoZnVuYykge1xuICAgICAgICBpZiAoIWZ1bmMpIHsgcmV0dXJuIFwiXCI7IH1cbiAgICAgICAgaWYgKGZ1bmMuZGlzcGxheU5hbWUpIHsgcmV0dXJuIGZ1bmMuZGlzcGxheU5hbWU7IH1cbiAgICAgICAgaWYgKGZ1bmMubmFtZSkgeyByZXR1cm4gZnVuYy5uYW1lOyB9XG4gICAgICAgIHZhciBtYXRjaGVzID0gZnVuYy50b1N0cmluZygpLm1hdGNoKC9mdW5jdGlvblxccysoW15cXChdKykvbSk7XG4gICAgICAgIHJldHVybiAobWF0Y2hlcyAmJiBtYXRjaGVzWzFdKSB8fCBcIlwiO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbnN0cnVjdG9yTmFtZShmLCBvYmplY3QpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBmdW5jdGlvbk5hbWUob2JqZWN0ICYmIG9iamVjdC5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIHZhciBleGNsdWRlcyA9IGYuZXhjbHVkZUNvbnN0cnVjdG9ycyB8fFxuICAgICAgICAgICAgICAgIGZvcm1hdGlvLmV4Y2x1ZGVDb25zdHJ1Y3RvcnMgfHwgW107XG5cbiAgICAgICAgdmFyIGksIGw7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBleGNsdWRlcy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhjbHVkZXNbaV0gPT09IFwic3RyaW5nXCIgJiYgZXhjbHVkZXNbaV0gPT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXhjbHVkZXNbaV0udGVzdCAmJiBleGNsdWRlc1tpXS50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBpc0NpcmN1bGFyKG9iamVjdCwgb2JqZWN0cykge1xuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIikgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgdmFyIGksIGw7XG4gICAgICAgIGZvciAoaSA9IDAsIGwgPSBvYmplY3RzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgaWYgKG9iamVjdHNbaV0gPT09IG9iamVjdCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhc2NpaShmLCBvYmplY3QsIHByb2Nlc3NlZCwgaW5kZW50KSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB2YXIgcXMgPSBmLnF1b3RlU3RyaW5ncztcbiAgICAgICAgICAgIHZhciBxdW90ZSA9IHR5cGVvZiBxcyAhPT0gXCJib29sZWFuXCIgfHwgcXM7XG4gICAgICAgICAgICByZXR1cm4gcHJvY2Vzc2VkIHx8IHF1b3RlID8gJ1wiJyArIG9iamVjdCArICdcIicgOiBvYmplY3Q7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIG9iamVjdCA9PT0gXCJmdW5jdGlvblwiICYmICEob2JqZWN0IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgcmV0dXJuIGFzY2lpLmZ1bmMob2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2Nlc3NlZCA9IHByb2Nlc3NlZCB8fCBbXTtcblxuICAgICAgICBpZiAoaXNDaXJjdWxhcihvYmplY3QsIHByb2Nlc3NlZCkpIHsgcmV0dXJuIFwiW0NpcmN1bGFyXVwiOyB9XG5cbiAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09PSBcIltvYmplY3QgQXJyYXldXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBhc2NpaS5hcnJheS5jYWxsKGYsIG9iamVjdCwgcHJvY2Vzc2VkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghb2JqZWN0KSB7IHJldHVybiBTdHJpbmcoKDEvb2JqZWN0KSA9PT0gLUluZmluaXR5ID8gXCItMFwiIDogb2JqZWN0KTsgfVxuICAgICAgICBpZiAoc2Ftc2FtLmlzRWxlbWVudChvYmplY3QpKSB7IHJldHVybiBhc2NpaS5lbGVtZW50KG9iamVjdCk7IH1cblxuICAgICAgICBpZiAodHlwZW9mIG9iamVjdC50b1N0cmluZyA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICAgICAgb2JqZWN0LnRvU3RyaW5nICE9PSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0LnRvU3RyaW5nKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaSwgbDtcbiAgICAgICAgZm9yIChpID0gMCwgbCA9IHNwZWNpYWxPYmplY3RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKG9iamVjdCA9PT0gc3BlY2lhbE9iamVjdHNbaV0ub2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNwZWNpYWxPYmplY3RzW2ldLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFzY2lpLm9iamVjdC5jYWxsKGYsIG9iamVjdCwgcHJvY2Vzc2VkLCBpbmRlbnQpO1xuICAgIH1cblxuICAgIGFzY2lpLmZ1bmMgPSBmdW5jdGlvbiAoZnVuYykge1xuICAgICAgICByZXR1cm4gXCJmdW5jdGlvbiBcIiArIGZ1bmN0aW9uTmFtZShmdW5jKSArIFwiKCkge31cIjtcbiAgICB9O1xuXG4gICAgYXNjaWkuYXJyYXkgPSBmdW5jdGlvbiAoYXJyYXksIHByb2Nlc3NlZCkge1xuICAgICAgICBwcm9jZXNzZWQgPSBwcm9jZXNzZWQgfHwgW107XG4gICAgICAgIHByb2Nlc3NlZC5wdXNoKGFycmF5KTtcbiAgICAgICAgdmFyIGksIGwsIHBpZWNlcyA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gYXJyYXkubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBwaWVjZXMucHVzaChhc2NpaSh0aGlzLCBhcnJheVtpXSwgcHJvY2Vzc2VkKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFwiW1wiICsgcGllY2VzLmpvaW4oXCIsIFwiKSArIFwiXVwiO1xuICAgIH07XG5cbiAgICBhc2NpaS5vYmplY3QgPSBmdW5jdGlvbiAob2JqZWN0LCBwcm9jZXNzZWQsIGluZGVudCkge1xuICAgICAgICBwcm9jZXNzZWQgPSBwcm9jZXNzZWQgfHwgW107XG4gICAgICAgIHByb2Nlc3NlZC5wdXNoKG9iamVjdCk7XG4gICAgICAgIGluZGVudCA9IGluZGVudCB8fCAwO1xuICAgICAgICB2YXIgcGllY2VzID0gW10sIHByb3BlcnRpZXMgPSBzYW1zYW0ua2V5cyhvYmplY3QpLnNvcnQoKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IDM7XG4gICAgICAgIHZhciBwcm9wLCBzdHIsIG9iaiwgaSwgbDtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsID0gcHJvcGVydGllcy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgIHByb3AgPSBwcm9wZXJ0aWVzW2ldO1xuICAgICAgICAgICAgb2JqID0gb2JqZWN0W3Byb3BdO1xuXG4gICAgICAgICAgICBpZiAoaXNDaXJjdWxhcihvYmosIHByb2Nlc3NlZCkpIHtcbiAgICAgICAgICAgICAgICBzdHIgPSBcIltDaXJjdWxhcl1cIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3RyID0gYXNjaWkodGhpcywgb2JqLCBwcm9jZXNzZWQsIGluZGVudCArIDIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdHIgPSAoL1xccy8udGVzdChwcm9wKSA/ICdcIicgKyBwcm9wICsgJ1wiJyA6IHByb3ApICsgXCI6IFwiICsgc3RyO1xuICAgICAgICAgICAgbGVuZ3RoICs9IHN0ci5sZW5ndGg7XG4gICAgICAgICAgICBwaWVjZXMucHVzaChzdHIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNvbnMgPSBjb25zdHJ1Y3Rvck5hbWUodGhpcywgb2JqZWN0KTtcbiAgICAgICAgdmFyIHByZWZpeCA9IGNvbnMgPyBcIltcIiArIGNvbnMgKyBcIl0gXCIgOiBcIlwiO1xuICAgICAgICB2YXIgaXMgPSBcIlwiO1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gaW5kZW50OyBpIDwgbDsgKytpKSB7IGlzICs9IFwiIFwiOyB9XG5cbiAgICAgICAgaWYgKGxlbmd0aCArIGluZGVudCA+IDgwKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlZml4ICsgXCJ7XFxuICBcIiArIGlzICsgcGllY2VzLmpvaW4oXCIsXFxuICBcIiArIGlzKSArIFwiXFxuXCIgK1xuICAgICAgICAgICAgICAgIGlzICsgXCJ9XCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByZWZpeCArIFwieyBcIiArIHBpZWNlcy5qb2luKFwiLCBcIikgKyBcIiB9XCI7XG4gICAgfTtcblxuICAgIGFzY2lpLmVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICB2YXIgdGFnTmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgYXR0cnMgPSBlbGVtZW50LmF0dHJpYnV0ZXMsIGF0dHIsIHBhaXJzID0gW10sIGF0dHJOYW1lLCBpLCBsLCB2YWw7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbCA9IGF0dHJzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgICAgICAgYXR0ciA9IGF0dHJzLml0ZW0oaSk7XG4gICAgICAgICAgICBhdHRyTmFtZSA9IGF0dHIubm9kZU5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiaHRtbDpcIiwgXCJcIik7XG4gICAgICAgICAgICB2YWwgPSBhdHRyLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIGlmIChhdHRyTmFtZSAhPT0gXCJjb250ZW50ZWRpdGFibGVcIiB8fCB2YWwgIT09IFwiaW5oZXJpdFwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEhdmFsKSB7IHBhaXJzLnB1c2goYXR0ck5hbWUgKyBcIj1cXFwiXCIgKyB2YWwgKyBcIlxcXCJcIik7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmb3JtYXR0ZWQgPSBcIjxcIiArIHRhZ05hbWUgKyAocGFpcnMubGVuZ3RoID4gMCA/IFwiIFwiIDogXCJcIik7XG4gICAgICAgIHZhciBjb250ZW50ID0gZWxlbWVudC5pbm5lckhUTUw7XG5cbiAgICAgICAgaWYgKGNvbnRlbnQubGVuZ3RoID4gMjApIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnN1YnN0cigwLCAyMCkgKyBcIlsuLi5dXCI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzID0gZm9ybWF0dGVkICsgcGFpcnMuam9pbihcIiBcIikgKyBcIj5cIiArIGNvbnRlbnQgK1xuICAgICAgICAgICAgICAgIFwiPC9cIiArIHRhZ05hbWUgKyBcIj5cIjtcblxuICAgICAgICByZXR1cm4gcmVzLnJlcGxhY2UoLyBjb250ZW50RWRpdGFibGU9XCJpbmhlcml0XCIvLCBcIlwiKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gRm9ybWF0aW8ob3B0aW9ucykge1xuICAgICAgICBmb3IgKHZhciBvcHQgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgdGhpc1tvcHRdID0gb3B0aW9uc1tvcHRdO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgRm9ybWF0aW8ucHJvdG90eXBlID0ge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IGZ1bmN0aW9uTmFtZSxcblxuICAgICAgICBjb25maWd1cmU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEZvcm1hdGlvKG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNvbnN0cnVjdG9yTmFtZTogZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yTmFtZSh0aGlzLCBvYmplY3QpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzY2lpOiBmdW5jdGlvbiAob2JqZWN0LCBwcm9jZXNzZWQsIGluZGVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGFzY2lpKHRoaXMsIG9iamVjdCwgcHJvY2Vzc2VkLCBpbmRlbnQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBGb3JtYXRpby5wcm90b3R5cGU7XG59KTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSkiLCIoKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kICYmIGZ1bmN0aW9uIChtKSB7IGRlZmluZShcInNhbXNhbVwiLCBtKTsgfSkgfHxcbiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgZnVuY3Rpb24gKG0pIHsgbW9kdWxlLmV4cG9ydHMgPSBtKCk7IH0pIHx8IC8vIE5vZGVcbiBmdW5jdGlvbiAobSkgeyB0aGlzLnNhbXNhbSA9IG0oKTsgfSAvLyBCcm93c2VyIGdsb2JhbHNcbikoZnVuY3Rpb24gKCkge1xuICAgIHZhciBvID0gT2JqZWN0LnByb3RvdHlwZTtcbiAgICB2YXIgZGl2ID0gdHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiICYmIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICBmdW5jdGlvbiBpc05hTih2YWx1ZSkge1xuICAgICAgICAvLyBVbmxpa2UgZ2xvYmFsIGlzTmFOLCB0aGlzIGF2b2lkcyB0eXBlIGNvZXJjaW9uXG4gICAgICAgIC8vIHR5cGVvZiBjaGVjayBhdm9pZHMgSUUgaG9zdCBvYmplY3QgaXNzdWVzLCBoYXQgdGlwIHRvXG4gICAgICAgIC8vIGxvZGFzaFxuICAgICAgICB2YXIgdmFsID0gdmFsdWU7IC8vIEpzTGludCB0aGlua3MgdmFsdWUgIT09IHZhbHVlIGlzIFwid2VpcmRcIlxuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIHZhbHVlICE9PSB2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0Q2xhc3ModmFsdWUpIHtcbiAgICAgICAgLy8gUmV0dXJucyB0aGUgaW50ZXJuYWwgW1tDbGFzc11dIGJ5IGNhbGxpbmcgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuICAgICAgICAvLyB3aXRoIHRoZSBwcm92aWRlZCB2YWx1ZSBhcyB0aGlzLiBSZXR1cm4gdmFsdWUgaXMgYSBzdHJpbmcsIG5hbWluZyB0aGVcbiAgICAgICAgLy8gaW50ZXJuYWwgY2xhc3MsIGUuZy4gXCJBcnJheVwiXG4gICAgICAgIHJldHVybiBvLnRvU3RyaW5nLmNhbGwodmFsdWUpLnNwbGl0KC9bIFxcXV0vKVsxXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBzYW1zYW0uaXNBcmd1bWVudHNcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iamVjdFxuICAgICAqXG4gICAgICogUmV0dXJucyBgYHRydWVgYCBpZiBgYG9iamVjdGBgIGlzIGFuIGBgYXJndW1lbnRzYGAgb2JqZWN0LFxuICAgICAqIGBgZmFsc2VgYCBvdGhlcndpc2UuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBvYmplY3QubGVuZ3RoICE9PSBcIm51bWJlclwiIHx8XG4gICAgICAgICAgICAgICAgZ2V0Q2xhc3Mob2JqZWN0KSA9PT0gXCJBcnJheVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3QuY2FsbGVlID09IFwiZnVuY3Rpb25cIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgb2JqZWN0W29iamVjdC5sZW5ndGhdID0gNjtcbiAgICAgICAgICAgIGRlbGV0ZSBvYmplY3Rbb2JqZWN0Lmxlbmd0aF07XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBzYW1zYW0uaXNFbGVtZW50XG4gICAgICogQHBhcmFtIE9iamVjdCBvYmplY3RcbiAgICAgKlxuICAgICAqIFJldHVybnMgYGB0cnVlYGAgaWYgYGBvYmplY3RgYCBpcyBhIERPTSBlbGVtZW50IG5vZGUuIFVubGlrZVxuICAgICAqIFVuZGVyc2NvcmUuanMvbG9kYXNoLCB0aGlzIGZ1bmN0aW9uIHdpbGwgcmV0dXJuIGBgZmFsc2VgYCBpZiBgYG9iamVjdGBgXG4gICAgICogaXMgYW4gKmVsZW1lbnQtbGlrZSogb2JqZWN0LCBpLmUuIGEgcmVndWxhciBvYmplY3Qgd2l0aCBhIGBgbm9kZVR5cGVgYFxuICAgICAqIHByb3BlcnR5IHRoYXQgaG9sZHMgdGhlIHZhbHVlIGBgMWBgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRWxlbWVudChvYmplY3QpIHtcbiAgICAgICAgaWYgKCFvYmplY3QgfHwgb2JqZWN0Lm5vZGVUeXBlICE9PSAxIHx8ICFkaXYpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvYmplY3QuYXBwZW5kQ2hpbGQoZGl2KTtcbiAgICAgICAgICAgIG9iamVjdC5yZW1vdmVDaGlsZChkaXYpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG5hbWUgc2Ftc2FtLmtleXNcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iamVjdFxuICAgICAqXG4gICAgICogUmV0dXJuIGFuIGFycmF5IG9mIG93biBwcm9wZXJ0eSBuYW1lcy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBrZXlzKG9iamVjdCkge1xuICAgICAgICB2YXIga3MgPSBbXSwgcHJvcDtcbiAgICAgICAgZm9yIChwcm9wIGluIG9iamVjdCkge1xuICAgICAgICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3ApKSB7IGtzLnB1c2gocHJvcCk7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga3M7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQG5hbWUgc2Ftc2FtLmlzRGF0ZVxuICAgICAqIEBwYXJhbSBPYmplY3QgdmFsdWVcbiAgICAgKlxuICAgICAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgb2JqZWN0IGlzIGEgYGBEYXRlYGAsIG9yICpkYXRlLWxpa2UqLiBEdWNrIHR5cGluZ1xuICAgICAqIG9mIGRhdGUgb2JqZWN0cyB3b3JrIGJ5IGNoZWNraW5nIHRoYXQgdGhlIG9iamVjdCBoYXMgYSBgYGdldFRpbWVgYFxuICAgICAqIGZ1bmN0aW9uIHdob3NlIHJldHVybiB2YWx1ZSBlcXVhbHMgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBvYmplY3Qnc1xuICAgICAqIGBgdmFsdWVPZmBgLlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzRGF0ZSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlLmdldFRpbWUgPT0gXCJmdW5jdGlvblwiICYmXG4gICAgICAgICAgICB2YWx1ZS5nZXRUaW1lKCkgPT0gdmFsdWUudmFsdWVPZigpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBuYW1lIHNhbXNhbS5pc05lZ1plcm9cbiAgICAgKiBAcGFyYW0gT2JqZWN0IHZhbHVlXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIGBgdHJ1ZWBgIGlmIGBgdmFsdWVgYCBpcyBgYC0wYGAuXG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNOZWdaZXJvKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPT09IC1JbmZpbml0eTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBzYW1zYW0uZXF1YWxcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajFcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajJcbiAgICAgKlxuICAgICAqIFJldHVybnMgYGB0cnVlYGAgaWYgdHdvIG9iamVjdHMgYXJlIHN0cmljdGx5IGVxdWFsLiBDb21wYXJlZCB0b1xuICAgICAqIGBgPT09YGAgdGhlcmUgYXJlIHR3byBleGNlcHRpb25zOlxuICAgICAqXG4gICAgICogICAtIE5hTiBpcyBjb25zaWRlcmVkIGVxdWFsIHRvIE5hTlxuICAgICAqICAgLSAtMCBhbmQgKzAgYXJlIG5vdCBjb25zaWRlcmVkIGVxdWFsXG4gICAgICovXG4gICAgZnVuY3Rpb24gaWRlbnRpY2FsKG9iajEsIG9iajIpIHtcbiAgICAgICAgaWYgKG9iajEgPT09IG9iajIgfHwgKGlzTmFOKG9iajEpICYmIGlzTmFOKG9iajIpKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9iajEgIT09IDAgfHwgaXNOZWdaZXJvKG9iajEpID09PSBpc05lZ1plcm8ob2JqMik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEBuYW1lIHNhbXNhbS5kZWVwRXF1YWxcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajFcbiAgICAgKiBAcGFyYW0gT2JqZWN0IG9iajJcbiAgICAgKlxuICAgICAqIERlZXAgZXF1YWwgY29tcGFyaXNvbi4gVHdvIHZhbHVlcyBhcmUgXCJkZWVwIGVxdWFsXCIgaWY6XG4gICAgICpcbiAgICAgKiAgIC0gVGhleSBhcmUgZXF1YWwsIGFjY29yZGluZyB0byBzYW1zYW0uaWRlbnRpY2FsXG4gICAgICogICAtIFRoZXkgYXJlIGJvdGggZGF0ZSBvYmplY3RzIHJlcHJlc2VudGluZyB0aGUgc2FtZSB0aW1lXG4gICAgICogICAtIFRoZXkgYXJlIGJvdGggYXJyYXlzIGNvbnRhaW5pbmcgZWxlbWVudHMgdGhhdCBhcmUgYWxsIGRlZXBFcXVhbFxuICAgICAqICAgLSBUaGV5IGFyZSBvYmplY3RzIHdpdGggdGhlIHNhbWUgc2V0IG9mIHByb3BlcnRpZXMsIGFuZCBlYWNoIHByb3BlcnR5XG4gICAgICogICAgIGluIGBgb2JqMWBgIGlzIGRlZXBFcXVhbCB0byB0aGUgY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBpbiBgYG9iajJgYFxuICAgICAqXG4gICAgICogU3VwcG9ydHMgY3ljbGljIG9iamVjdHMuXG4gICAgICovXG4gICAgZnVuY3Rpb24gZGVlcEVxdWFsQ3ljbGljKG9iajEsIG9iajIpIHtcblxuICAgICAgICAvLyB1c2VkIGZvciBjeWNsaWMgY29tcGFyaXNvblxuICAgICAgICAvLyBjb250YWluIGFscmVhZHkgdmlzaXRlZCBvYmplY3RzXG4gICAgICAgIHZhciBvYmplY3RzMSA9IFtdLFxuICAgICAgICAgICAgb2JqZWN0czIgPSBbXSxcbiAgICAgICAgLy8gY29udGFpbiBwYXRoZXMgKHBvc2l0aW9uIGluIHRoZSBvYmplY3Qgc3RydWN0dXJlKVxuICAgICAgICAvLyBvZiB0aGUgYWxyZWFkeSB2aXNpdGVkIG9iamVjdHNcbiAgICAgICAgLy8gaW5kZXhlcyBzYW1lIGFzIGluIG9iamVjdHMgYXJyYXlzXG4gICAgICAgICAgICBwYXRoczEgPSBbXSxcbiAgICAgICAgICAgIHBhdGhzMiA9IFtdLFxuICAgICAgICAvLyBjb250YWlucyBjb21iaW5hdGlvbnMgb2YgYWxyZWFkeSBjb21wYXJlZCBvYmplY3RzXG4gICAgICAgIC8vIGluIHRoZSBtYW5uZXI6IHsgXCIkMVsncmVmJ10kMlsncmVmJ11cIjogdHJ1ZSB9XG4gICAgICAgICAgICBjb21wYXJlZCA9IHt9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiB1c2VkIHRvIGNoZWNrLCBpZiB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpcyBhbiBvYmplY3RcbiAgICAgICAgICogKGN5Y2xpYyBsb2dpYyBpcyBvbmx5IG5lZWRlZCBmb3Igb2JqZWN0cylcbiAgICAgICAgICogb25seSBuZWVkZWQgZm9yIGN5Y2xpYyBsb2dpY1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgISh2YWx1ZSBpbnN0YW5jZW9mIEJvb2xlYW4pICYmXG4gICAgICAgICAgICAgICAgICAgICEodmFsdWUgaW5zdGFuY2VvZiBEYXRlKSAgICAmJlxuICAgICAgICAgICAgICAgICAgICAhKHZhbHVlIGluc3RhbmNlb2YgTnVtYmVyKSAgJiZcbiAgICAgICAgICAgICAgICAgICAgISh2YWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkgICYmXG4gICAgICAgICAgICAgICAgICAgICEodmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcpKSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIHJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBnaXZlbiBvYmplY3QgaW4gdGhlXG4gICAgICAgICAqIGdpdmVuIG9iamVjdHMgYXJyYXksIC0xIGlmIG5vdCBjb250YWluZWRcbiAgICAgICAgICogb25seSBuZWVkZWQgZm9yIGN5Y2xpYyBsb2dpY1xuICAgICAgICAgKi9cbiAgICAgICAgZnVuY3Rpb24gZ2V0SW5kZXgob2JqZWN0cywgb2JqKSB7XG5cbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9iamVjdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0c1tpXSA9PT0gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG9lcyB0aGUgcmVjdXJzaW9uIGZvciB0aGUgZGVlcCBlcXVhbCBjaGVja1xuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIGRlZXBFcXVhbChvYmoxLCBvYmoyLCBwYXRoMSwgcGF0aDIpIHtcbiAgICAgICAgICAgIHZhciB0eXBlMSA9IHR5cGVvZiBvYmoxO1xuICAgICAgICAgICAgdmFyIHR5cGUyID0gdHlwZW9mIG9iajI7XG5cbiAgICAgICAgICAgIC8vID09IG51bGwgYWxzbyBtYXRjaGVzIHVuZGVmaW5lZFxuICAgICAgICAgICAgaWYgKG9iajEgPT09IG9iajIgfHxcbiAgICAgICAgICAgICAgICAgICAgaXNOYU4ob2JqMSkgfHwgaXNOYU4ob2JqMikgfHxcbiAgICAgICAgICAgICAgICAgICAgb2JqMSA9PSBudWxsIHx8IG9iajIgPT0gbnVsbCB8fFxuICAgICAgICAgICAgICAgICAgICB0eXBlMSAhPT0gXCJvYmplY3RcIiB8fCB0eXBlMiAhPT0gXCJvYmplY3RcIikge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGlkZW50aWNhbChvYmoxLCBvYmoyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRWxlbWVudHMgYXJlIG9ubHkgZXF1YWwgaWYgaWRlbnRpY2FsKGV4cGVjdGVkLCBhY3R1YWwpXG4gICAgICAgICAgICBpZiAoaXNFbGVtZW50KG9iajEpIHx8IGlzRWxlbWVudChvYmoyKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAgICAgdmFyIGlzRGF0ZTEgPSBpc0RhdGUob2JqMSksIGlzRGF0ZTIgPSBpc0RhdGUob2JqMik7XG4gICAgICAgICAgICBpZiAoaXNEYXRlMSB8fCBpc0RhdGUyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0RhdGUxIHx8ICFpc0RhdGUyIHx8IG9iajEuZ2V0VGltZSgpICE9PSBvYmoyLmdldFRpbWUoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAob2JqMSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBvYmoyIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iajEudG9TdHJpbmcoKSAhPT0gb2JqMi50b1N0cmluZygpKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY2xhc3MxID0gZ2V0Q2xhc3Mob2JqMSk7XG4gICAgICAgICAgICB2YXIgY2xhc3MyID0gZ2V0Q2xhc3Mob2JqMik7XG4gICAgICAgICAgICB2YXIga2V5czEgPSBrZXlzKG9iajEpO1xuICAgICAgICAgICAgdmFyIGtleXMyID0ga2V5cyhvYmoyKTtcblxuICAgICAgICAgICAgaWYgKGlzQXJndW1lbnRzKG9iajEpIHx8IGlzQXJndW1lbnRzKG9iajIpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iajEubGVuZ3RoICE9PSBvYmoyLmxlbmd0aCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUxICE9PSB0eXBlMiB8fCBjbGFzczEgIT09IGNsYXNzMiB8fFxuICAgICAgICAgICAgICAgICAgICAgICAga2V5czEubGVuZ3RoICE9PSBrZXlzMi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGtleSwgaSwgbCxcbiAgICAgICAgICAgICAgICAvLyBmb2xsb3dpbmcgdmFycyBhcmUgdXNlZCBmb3IgdGhlIGN5Y2xpYyBsb2dpY1xuICAgICAgICAgICAgICAgIHZhbHVlMSwgdmFsdWUyLFxuICAgICAgICAgICAgICAgIGlzT2JqZWN0MSwgaXNPYmplY3QyLFxuICAgICAgICAgICAgICAgIGluZGV4MSwgaW5kZXgyLFxuICAgICAgICAgICAgICAgIG5ld1BhdGgxLCBuZXdQYXRoMjtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbCA9IGtleXMxLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIGtleSA9IGtleXMxW2ldO1xuICAgICAgICAgICAgICAgIGlmICghby5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iajIsIGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFN0YXJ0IG9mIHRoZSBjeWNsaWMgbG9naWNcblxuICAgICAgICAgICAgICAgIHZhbHVlMSA9IG9iajFba2V5XTtcbiAgICAgICAgICAgICAgICB2YWx1ZTIgPSBvYmoyW2tleV07XG5cbiAgICAgICAgICAgICAgICBpc09iamVjdDEgPSBpc09iamVjdCh2YWx1ZTEpO1xuICAgICAgICAgICAgICAgIGlzT2JqZWN0MiA9IGlzT2JqZWN0KHZhbHVlMik7XG5cbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUsIGlmIHRoZSBvYmplY3RzIHdlcmUgYWxyZWFkeSB2aXNpdGVkXG4gICAgICAgICAgICAgICAgLy8gKGl0J3MgZmFzdGVyIHRvIGNoZWNrIGZvciBpc09iamVjdCBmaXJzdCwgdGhhbiB0b1xuICAgICAgICAgICAgICAgIC8vIGdldCAtMSBmcm9tIGdldEluZGV4IGZvciBub24gb2JqZWN0cylcbiAgICAgICAgICAgICAgICBpbmRleDEgPSBpc09iamVjdDEgPyBnZXRJbmRleChvYmplY3RzMSwgdmFsdWUxKSA6IC0xO1xuICAgICAgICAgICAgICAgIGluZGV4MiA9IGlzT2JqZWN0MiA/IGdldEluZGV4KG9iamVjdHMyLCB2YWx1ZTIpIDogLTE7XG5cbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUgdGhlIG5ldyBwYXRoZXMgb2YgdGhlIG9iamVjdHNcbiAgICAgICAgICAgICAgICAvLyAtIGZvciBub24gY3ljbGljIG9iamVjdHMgdGhlIGN1cnJlbnQgcGF0aCB3aWxsIGJlIGV4dGVuZGVkXG4gICAgICAgICAgICAgICAgLy8gICBieSBjdXJyZW50IHByb3BlcnR5IG5hbWVcbiAgICAgICAgICAgICAgICAvLyAtIGZvciBjeWNsaWMgb2JqZWN0cyB0aGUgc3RvcmVkIHBhdGggaXMgdGFrZW5cbiAgICAgICAgICAgICAgICBuZXdQYXRoMSA9IGluZGV4MSAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBwYXRoczFbaW5kZXgxXVxuICAgICAgICAgICAgICAgICAgICA6IHBhdGgxICsgJ1snICsgSlNPTi5zdHJpbmdpZnkoa2V5KSArICddJztcbiAgICAgICAgICAgICAgICBuZXdQYXRoMiA9IGluZGV4MiAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgPyBwYXRoczJbaW5kZXgyXVxuICAgICAgICAgICAgICAgICAgICA6IHBhdGgyICsgJ1snICsgSlNPTi5zdHJpbmdpZnkoa2V5KSArICddJztcblxuICAgICAgICAgICAgICAgIC8vIHN0b3AgcmVjdXJzaW9uIGlmIGN1cnJlbnQgb2JqZWN0cyBhcmUgYWxyZWFkeSBjb21wYXJlZFxuICAgICAgICAgICAgICAgIGlmIChjb21wYXJlZFtuZXdQYXRoMSArIG5ld1BhdGgyXSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciB0aGUgY3VycmVudCBvYmplY3RzIGFuZCB0aGVpciBwYXRoZXNcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXgxID09PSAtMSAmJiBpc09iamVjdDEpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0czEucHVzaCh2YWx1ZTEpO1xuICAgICAgICAgICAgICAgICAgICBwYXRoczEucHVzaChuZXdQYXRoMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpbmRleDIgPT09IC0xICYmIGlzT2JqZWN0Mikge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3RzMi5wdXNoKHZhbHVlMik7XG4gICAgICAgICAgICAgICAgICAgIHBhdGhzMi5wdXNoKG5ld1BhdGgyKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyByZW1lbWJlciB0aGF0IHRoZSBjdXJyZW50IG9iamVjdHMgYXJlIGFscmVhZHkgY29tcGFyZWRcbiAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QxICYmIGlzT2JqZWN0Mikge1xuICAgICAgICAgICAgICAgICAgICBjb21wYXJlZFtuZXdQYXRoMSArIG5ld1BhdGgyXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRW5kIG9mIGN5Y2xpYyBsb2dpY1xuXG4gICAgICAgICAgICAgICAgLy8gbmVpdGhlciB2YWx1ZTEgbm9yIHZhbHVlMiBpcyBhIGN5Y2xlXG4gICAgICAgICAgICAgICAgLy8gY29udGludWUgd2l0aCBuZXh0IGxldmVsXG4gICAgICAgICAgICAgICAgaWYgKCFkZWVwRXF1YWwodmFsdWUxLCB2YWx1ZTIsIG5ld1BhdGgxLCBuZXdQYXRoMikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgfShvYmoxLCBvYmoyLCAnJDEnLCAnJDInKSk7XG4gICAgfVxuXG4gICAgdmFyIG1hdGNoO1xuXG4gICAgZnVuY3Rpb24gYXJyYXlDb250YWlucyhhcnJheSwgc3Vic2V0KSB7XG4gICAgICAgIGlmIChzdWJzZXQubGVuZ3RoID09PSAwKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIHZhciBpLCBsLCBqLCBrO1xuICAgICAgICBmb3IgKGkgPSAwLCBsID0gYXJyYXkubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2goYXJyYXlbaV0sIHN1YnNldFswXSkpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBrID0gc3Vic2V0Lmxlbmd0aDsgaiA8IGs7ICsraikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW1hdGNoKGFycmF5W2kgKyBqXSwgc3Vic2V0W2pdKSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBuYW1lIHNhbXNhbS5tYXRjaFxuICAgICAqIEBwYXJhbSBPYmplY3Qgb2JqZWN0XG4gICAgICogQHBhcmFtIE9iamVjdCBtYXRjaGVyXG4gICAgICpcbiAgICAgKiBDb21wYXJlIGFyYml0cmFyeSB2YWx1ZSBgYG9iamVjdGBgIHdpdGggbWF0Y2hlci5cbiAgICAgKi9cbiAgICBtYXRjaCA9IGZ1bmN0aW9uIG1hdGNoKG9iamVjdCwgbWF0Y2hlcikge1xuICAgICAgICBpZiAobWF0Y2hlciAmJiB0eXBlb2YgbWF0Y2hlci50ZXN0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVyLnRlc3Qob2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcihvYmplY3QpID09PSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBtYXRjaGVyID0gbWF0Y2hlci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIG5vdE51bGwgPSB0eXBlb2Ygb2JqZWN0ID09PSBcInN0cmluZ1wiIHx8ICEhb2JqZWN0O1xuICAgICAgICAgICAgcmV0dXJuIG5vdE51bGwgJiZcbiAgICAgICAgICAgICAgICAoU3RyaW5nKG9iamVjdCkpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihtYXRjaGVyKSA+PSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlciA9PT0gb2JqZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSBcImJvb2xlYW5cIikge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZXIgPT09IG9iamVjdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChnZXRDbGFzcyhvYmplY3QpID09PSBcIkFycmF5XCIgJiYgZ2V0Q2xhc3MobWF0Y2hlcikgPT09IFwiQXJyYXlcIikge1xuICAgICAgICAgICAgcmV0dXJuIGFycmF5Q29udGFpbnMob2JqZWN0LCBtYXRjaGVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtYXRjaGVyICYmIHR5cGVvZiBtYXRjaGVyID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICB2YXIgcHJvcDtcbiAgICAgICAgICAgIGZvciAocHJvcCBpbiBtYXRjaGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaChvYmplY3RbcHJvcF0sIG1hdGNoZXJbcHJvcF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1hdGNoZXIgd2FzIG5vdCBhIHN0cmluZywgYSBudW1iZXIsIGEgXCIgK1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJmdW5jdGlvbiwgYSBib29sZWFuIG9yIGFuIG9iamVjdFwiKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaXNBcmd1bWVudHM6IGlzQXJndW1lbnRzLFxuICAgICAgICBpc0VsZW1lbnQ6IGlzRWxlbWVudCxcbiAgICAgICAgaXNEYXRlOiBpc0RhdGUsXG4gICAgICAgIGlzTmVnWmVybzogaXNOZWdaZXJvLFxuICAgICAgICBpZGVudGljYWw6IGlkZW50aWNhbCxcbiAgICAgICAgZGVlcEVxdWFsOiBkZWVwRXF1YWxDeWNsaWMsXG4gICAgICAgIG1hdGNoOiBtYXRjaCxcbiAgICAgICAga2V5czoga2V5c1xuICAgIH07XG59KTtcbiIsIihmdW5jdGlvbihyb290KSB7XG4gICAgdmFyIHVub3BpbmlvbmF0ZSA9IHtcbiAgICAgICAgc2VsZWN0b3I6IHJvb3QualF1ZXJ5IHx8IHJvb3QuWmVwdG8gfHwgcm9vdC5lbmRlciB8fCByb290LiQsXG4gICAgICAgIHRlbXBsYXRlOiByb290LkhhbmRsZWJhcnMgfHwgcm9vdC5NdXN0YWNoZVxuICAgIH07XG5cbiAgICAvKioqIEV4cG9ydCAqKiovXG5cbiAgICAvL0FNRFxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoW10sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHVub3BpbmlvbmF0ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8vQ29tbW9uSlNcbiAgICBlbHNlIGlmKHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB1bm9waW5pb25hdGU7XG4gICAgfVxuICAgIC8vR2xvYmFsXG4gICAgZWxzZSB7XG4gICAgICAgIHJvb3QudW5vcGluaW9uYXRlID0gdW5vcGluaW9uYXRlO1xuICAgIH1cbn0pKHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB0aGlzKTtcbiIsInZhciAkID0gcmVxdWlyZSgndW5vcGluaW9uYXRlJykuc2VsZWN0b3IsXG4gICAgICAgIHNwZWNpYWxLZXlzID0gcmVxdWlyZSgnLi9zcGVjaWFsS2V5cycpO1xuXG52YXIgJHdpbmRvdyA9ICQod2luZG93KTtcblxudmFyIEV2ZW50ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICB0aGlzLnNlbGVjdG9yICAgPSBzZWxlY3RvcjtcbiAgICB0aGlzLiRzY29wZSAgICAgPSBzZWxlY3RvciA/ICQoc2VsZWN0b3IpIDogJHdpbmRvdztcbiAgICB0aGlzLmNhbGxiYWNrcyAgPSBbXTtcbiAgICB0aGlzLmFjdGl2ZSAgICAgPSB0cnVlO1xufTtcblxuRXZlbnQucHJvdG90eXBlID0ge1xuICAgIHVwOiBmdW5jdGlvbihldmVudHMpIHtcbiAgICAgICAgdGhpcy5iaW5kKCd1cCcsIGV2ZW50cyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgZG93bjogZnVuY3Rpb24oZXZlbnRzKSB7XG4gICAgICAgIHRoaXMuYmluZCgnZG93bicsIGV2ZW50cyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgYmluZDogZnVuY3Rpb24odHlwZSwgZXZlbnRzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZigkLmlzUGxhaW5PYmplY3QoZXZlbnRzKSkge1xuICAgICAgICAgICAgJC5lYWNoKGV2ZW50cywgZnVuY3Rpb24oa2V5LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbGYuX2FkZCh0eXBlLCBrZXksIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fYWRkKHR5cGUsIGZhbHNlLCBldmVudHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICBvZmY6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRzY29wZVxuICAgICAgICAgICAgLnVuYmluZCgna2V5ZG93bicpXG4gICAgICAgICAgICAudW5iaW5kKCdrZXl1cCcpO1xuICAgIH0sXG5cbiAgICAvKioqIEludGVybmFsIEZ1bmN0aW9ucyAqKiovXG4gICAgX2FkZDogZnVuY3Rpb24odHlwZSwgY29uZGl0aW9ucywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmKCF0aGlzLmNhbGxiYWNrc1t0eXBlXSkge1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja3NbdHlwZV0gPSBbXTtcblxuICAgICAgICAgICAgdGhpcy4kc2NvcGUuYmluZCgna2V5JyArIHR5cGUsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBpZihzZWxmLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2tzID0gc2VsZi5jYWxsYmFja3NbdHlwZV07XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpPTA7IGk8Y2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZighY2FsbGJhY2suY29uZGl0aW9ucyB8fCBzZWxmLl92YWxpZGF0ZShjYWxsYmFjay5jb25kaXRpb25zLCBlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihjb25kaXRpb25zKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5jb25kaXRpb25zID0gdGhpcy5fcGFyc2VDb25kaXRpb25zKGNvbmRpdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFja3NbdHlwZV0ucHVzaChjYWxsYmFjayk7XG4gICAgfSxcbiAgICBfcGFyc2VDb25kaXRpb25zOiBmdW5jdGlvbihjKSB7XG4gICAgICAgIHZhciBjb25kaXRpb25zID0ge1xuICAgICAgICAgICAgc2hpZnQ6ICAgL1xcYnNoaWZ0XFxiL2kudGVzdChjKSxcbiAgICAgICAgICAgIGFsdDogICAgIC9cXGIoYWx0fGFsdGVybmF0ZSlcXGIvaS50ZXN0KGMpLFxuICAgICAgICAgICAgY3RybDogICAgL1xcYihjdHJsfGNvbnRyb2x8Y21kfGNvbW1hbmQpXFxiL2kudGVzdChjKVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vS2V5IEJpbmRpbmdcbiAgICAgICAgdmFyIGtleXMgPSBjLm1hdGNoKC9cXGIoPyFzaGlmdHxhbHR8YWx0ZXJuYXRlfGN0cmx8Y29udHJvbHxjbWR8Y29tbWFuZCkoXFx3KylcXGIvZ2kpO1xuXG4gICAgICAgIGlmKCFrZXlzKSB7XG4gICAgICAgICAgICAvL1VzZSBtb2RpZmllciBhcyBrZXkgaWYgdGhlcmUgaXMgbm8gb3RoZXIga2V5XG4gICAgICAgICAgICBrZXlzID0gYy5tYXRjaCgvXFxiKFxcdyspXFxiL2dpKTtcblxuICAgICAgICAgICAgLy9Nb2RpZmllcnMgc2hvdWxkIGFsbCBiZSBmYWxzZVxuICAgICAgICAgICAgY29uZGl0aW9ucy5zaGlmdCA9XG4gICAgICAgICAgICBjb25kaXRpb25zLmFsdCAgID1cbiAgICAgICAgICAgIGNvbmRpdGlvbnMuY3RybCAgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGtleXMpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMua2V5ID0ga2V5c1swXTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoa2V5cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTW9yZSB0aGFuIG9uZSBrZXkgYm91bmQgaW4gJ1wiK2MrXCInLiBVc2luZyB0aGUgZmlyc3Qgb25lIChcIitrZXlzWzBdK1wiKS5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLmtleSAgICAgID0gbnVsbDtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMua2V5Q29kZSAgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnM7XG4gICAgfSxcbiAgICBfa2V5Q29kZVRlc3Q6IGZ1bmN0aW9uKGtleSwga2V5Q29kZSkge1xuICAgICAgICBpZih0eXBlb2Ygc3BlY2lhbEtleXNba2V5Q29kZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB2YXIga2V5RGVmID0gc3BlY2lhbEtleXNba2V5Q29kZV07XG5cbiAgICAgICAgICAgIGlmKGtleURlZiBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBrZXlEZWYudGVzdChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGtleURlZiA9PT0ga2V5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihrZXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4ga2V5LnRvVXBwZXJDYXNlKCkuY2hhckNvZGVBdCgwKSA9PT0ga2V5Q29kZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgX3ZhbGlkYXRlOiBmdW5jdGlvbihjLCBlKSB7XG4gICAgICAgIHJldHVybiAgKGMua2V5ID8gdGhpcy5fa2V5Q29kZVRlc3QoYy5rZXksIGUud2hpY2gpIDogdHJ1ZSkgJiZcbiAgICAgICAgICAgICAgICBjLnNoaWZ0ID09PSBlLnNoaWZ0S2V5ICYmXG4gICAgICAgICAgICAgICAgYy5hbHQgICA9PT0gZS5hbHRLZXkgJiZcbiAgICAgICAgICAgICAgICAoIWMuY3RybCB8fCAoYy5jdHJsID09PSBlLm1ldGFLZXkpICE9PSAoYy5jdHJsID09PSBlLmN0cmxLZXkpKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50O1xuXG4iLCJ2YXIgRXZlbnQgPSByZXF1aXJlKCcuL0V2ZW50LmpzJyksXG4gICAgZXZlbnRzID0gW107XG5cbnZhciBrZXkgPSBmdW5jdGlvbihzZWxlY3RvcikgeyAvL0ZhY3RvcnkgZm9yIEV2ZW50IG9iamVjdHNcbiAgICByZXR1cm4ga2V5Ll9jcmVhdGVFdmVudChzZWxlY3Rvcik7XG59O1xuXG5rZXkuZG93biA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHJldHVybiB0aGlzLl9jcmVhdGVFdmVudCgpLmRvd24oY29uZmlnKTtcbn07XG5cbmtleS51cCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHJldHVybiB0aGlzLl9jcmVhdGVFdmVudCgpLnVwKGNvbmZpZyk7XG59O1xuXG5rZXkudW5iaW5kQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgd2hpbGUoZXZlbnRzLmxlbmd0aCkge1xuICAgICAgICBldmVudHMucG9wKCkuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy9DcmVhdGVzIG5ldyBFdmVudCBvYmplY3RzIChjaGVja2luZyBmb3IgZXhpc3RpbmcgZmlyc3QpXG5rZXkuX2NyZWF0ZUV2ZW50ID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICB2YXIgZSA9IG5ldyBFdmVudChzZWxlY3Rvcik7XG4gICAgZXZlbnRzLnB1c2goZSk7XG4gICAgcmV0dXJuIGU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGtleTtcbiIsIi8vQWRvcHRlZCBmcm9tIFtqUXVlcnkgaG90a2V5c10oaHR0cHM6Ly9naXRodWIuY29tL2plcmVzaWcvanF1ZXJ5LmhvdGtleXMvYmxvYi9tYXN0ZXIvanF1ZXJ5LmhvdGtleXMuanMpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIDg6IFwiYmFja3NwYWNlXCIsXG4gICAgOTogXCJ0YWJcIixcbiAgICAxMDogL14ocmV0dXJufGVudGVyKSQvaSxcbiAgICAxMzogL14ocmV0dXJufGVudGVyKSQvaSxcbiAgICAxNjogXCJzaGlmdFwiLFxuICAgIDE3OiAvXihjdHJsfGNvbnRyb2wpJC9pLFxuICAgIDE4OiAvXihhbHR8YWx0ZXJuYXRlKSQvaSxcbiAgICAxOTogXCJwYXVzZVwiLFxuICAgIDIwOiBcImNhcHNsb2NrXCIsXG4gICAgMjc6IC9eKGVzY3xlc2NhcGUpJC9pLFxuICAgIDMyOiBcInNwYWNlXCIsXG4gICAgMzM6IFwicGFnZXVwXCIsXG4gICAgMzQ6IFwicGFnZWRvd25cIixcbiAgICAzNTogXCJlbmRcIixcbiAgICAzNjogXCJob21lXCIsXG4gICAgMzc6IFwibGVmdFwiLFxuICAgIDM4OiBcInVwXCIsXG4gICAgMzk6IFwicmlnaHRcIixcbiAgICA0MDogXCJkb3duXCIsXG4gICAgNDU6IFwiaW5zZXJ0XCIsXG4gICAgNDY6IC9eKGRlbHxkZWxldGUpJC9pLFxuICAgIDkxOiAvXihjbWR8Y29tbWFuZCkkL2ksXG4gICAgOTY6IFwiMFwiLFxuICAgIDk3OiBcIjFcIixcbiAgICA5ODogXCIyXCIsXG4gICAgOTk6IFwiM1wiLFxuICAgIDEwMDogXCI0XCIsXG4gICAgMTAxOiBcIjVcIixcbiAgICAxMDI6IFwiNlwiLFxuICAgIDEwMzogXCI3XCIsXG4gICAgMTA0OiBcIjhcIixcbiAgICAxMDU6IFwiOVwiLFxuICAgIDEwNjogXCIqXCIsXG4gICAgMTA3OiBcIitcIixcbiAgICAxMDk6IFwiLVwiLFxuICAgIDExMDogXCIuXCIsXG4gICAgMTExIDogXCIvXCIsXG4gICAgMTEyOiBcImYxXCIsXG4gICAgMTEzOiBcImYyXCIsXG4gICAgMTE0OiBcImYzXCIsXG4gICAgMTE1OiBcImY0XCIsXG4gICAgMTE2OiBcImY1XCIsXG4gICAgMTE3OiBcImY2XCIsXG4gICAgMTE4OiBcImY3XCIsXG4gICAgMTE5OiBcImY4XCIsXG4gICAgMTIwOiBcImY5XCIsXG4gICAgMTIxOiBcImYxMFwiLFxuICAgIDEyMjogXCJmMTFcIixcbiAgICAxMjM6IFwiZjEyXCIsXG4gICAgMTQ0OiBcIm51bWxvY2tcIixcbiAgICAxNDU6IFwic2Nyb2xsXCIsXG4gICAgMTg2OiBcIjtcIixcbiAgICAxODc6IFwiPVwiLFxuICAgIDE4OTogXCItXCIsXG4gICAgMTkwOiBcIi5cIixcbiAgICAxOTE6IFwiL1wiLFxuICAgIDE5MjogXCJgXCIsXG4gICAgMjE5OiBcIltcIixcbiAgICAyMjA6IFwiXFxcXFwiLFxuICAgIDIyMTogXCJdXCIsXG4gICAgMjIyOiBcIidcIixcbiAgICAyMjQ6IFwibWV0YVwiXG59O1xuIiwidmFyIHNpbm9uID0gcmVxdWlyZSgnc2lub24nKSxcbiAgICBrZXkgICA9IHJlcXVpcmUoJy4uL3NyYy9tYWluJyksXG4gICAgbW9kdWxlID0gd2luZG93Lm1vZHVsZSxcbiAgICBzYW5kYm94LFxuICAgIHRlc3RDYWxsYmFjaztcblxuLyoqKiBHTE9CQUwgS0VZIEVWRU5UUyAqKiovXG5cbm1vZHVsZShcImdsb2JhbCBrZXkgZXZlbnRzXCIsIHtcbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHNhbmRib3ggICAgICAgICA9IHNpbm9uLnNhbmRib3guY3JlYXRlKCk7XG4gICAgICAgIHRlc3RDYWxsYmFjayAgICA9IHNpbm9uLnNweSgpO1xuICAgIH0sXG4gICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICBrZXkudW5iaW5kQWxsKCk7XG4gICAgfVxufSk7XG5cbnRlc3QoJ2tleS5kb3duJywgZnVuY3Rpb24oKSB7XG4gICAga2V5LmRvd24odGVzdENhbGxiYWNrKTtcblxuICAgICQoZG9jdW1lbnQpLmtleWRvd24oKTtcbiAgICAkKHdpbmRvdykua2V5ZG93bigpO1xuXG4gICAgZGVlcEVxdWFsKHRlc3RDYWxsYmFjay5jYWxsQ291bnQsIDIpO1xufSk7XG5cbnRlc3QoJ2tleS51cCcsIGZ1bmN0aW9uKCkge1xuICAgIGtleS51cCh0ZXN0Q2FsbGJhY2spO1xuXG4gICAgJChkb2N1bWVudCkua2V5dXAoKTtcbiAgICAkKHdpbmRvdykua2V5dXAoKTtcblxuICAgIGRlZXBFcXVhbCh0ZXN0Q2FsbGJhY2suY2FsbENvdW50LCAyKTtcbn0pO1xuXG50ZXN0KCdrZXkudW5iaW5kQWxsJywgZnVuY3Rpb24oKSB7XG4gICAga2V5LmRvd24odGVzdENhbGxiYWNrKTtcbiAgICBrZXkudXAodGVzdENhbGxiYWNrKTtcbiAgICBrZXkudW5iaW5kQWxsKCk7XG5cbiAgICAkKHdpbmRvdykua2V5ZG93bigpLmtleXVwKCk7XG5cbiAgICBvayghdGVzdENhbGxiYWNrLmNhbGxlZCk7XG59KTtcblxuXG50ZXN0KCdrZXkuX2NyZWF0ZUV2ZW50JywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGtleWV2ZW50MSA9IGtleS5kb3duKHRlc3RDYWxsYmFjayksXG4gICAgICAgIGtleWV2ZW50MiA9IGtleS51cCh0ZXN0Q2FsbGJhY2spO1xuXG4gICAgbm90RXF1YWwoa2V5ZXZlbnQxLCBrZXlldmVudDIsIFwiR2xvYmFsIGtleSBldmVudHMgc2hvdWxkIHJldHVybiBkaWZmZXJlbnQgRXZlbnQgb2JqZWN0c1wiKTtcblxuICAgIGtleWRvd24xID0ga2V5KCcjaW5wdXQnKTtcbiAgICBrZXlkb3duMiA9IGtleSgnI2lucHV0Jyk7XG5cbiAgICBkZWVwRXF1YWwoa2V5ZXZlbnQxLCBrZXlldmVudDIsIFwiS2V5IGV2ZW50cyB3aXRoIHRoZSBzYW1lIHNlbGVjdG9yIHNob3VsZCByZXR1cm4gZGlmZmVyZW50IEV2ZW50IG9iamVjdHNcIik7XG59KTtcblxuXG4vKioqIERPTSBFTEVNRU5UIEtFWSBFVkVOVFMgKioqL1xuXG52YXIgJGlucHV0LFxuICAgIGtleUV2ZW50O1xuXG5tb2R1bGUoXCJET00gZWxlbWVudCBrZXkgZXZlbnRzXCIsIHtcbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHNhbmRib3ggICAgICAgICA9IHNpbm9uLnNhbmRib3guY3JlYXRlKCk7XG4gICAgICAgIHRlc3RDYWxsYmFjayAgICA9IHNpbm9uLnNweSgpO1xuICAgICAgICAkaW5wdXQgICAgICAgICAgPSAkKFwiI2lucHV0XCIpO1xuICAgICAgICBrZXlFdmVudCAgICAgICAgPSBrZXkoJGlucHV0KTtcbiAgICB9LFxuICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAga2V5LnVuYmluZEFsbCgpO1xuICAgIH1cbn0pO1xuXG50ZXN0KCdrZXlFdmVudC51cCcsIGZ1bmN0aW9uKCkge1xuICAgIGtleUV2ZW50LnVwKHRlc3RDYWxsYmFjayk7XG5cbiAgICAkaW5wdXQua2V5dXAoKTtcbiAgICBvayh0ZXN0Q2FsbGJhY2suY2FsbGVkKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5kb3duJywgZnVuY3Rpb24oKSB7XG4gICAga2V5RXZlbnQuZG93bih0ZXN0Q2FsbGJhY2spO1xuICAgIFxuICAgICRpbnB1dC5rZXlkb3duKCk7XG4gICAgb2sodGVzdENhbGxiYWNrLmNhbGxlZCk7XG59KTtcblxudGVzdCgna2V5RXZlbnQuYmluZCcsIGZ1bmN0aW9uKCkge1xuICAgIGtleUV2ZW50LmJpbmQoJ2Rvd24nLCB0ZXN0Q2FsbGJhY2spO1xuXG4gICAgJGlucHV0LmtleWRvd24oKTtcbiAgICBvayh0ZXN0Q2FsbGJhY2suY2FsbGVkKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudCBvZmYvb24nLCBmdW5jdGlvbigpIHtcbiAgICBrZXlFdmVudFxuICAgICAgICAuZG93bih0ZXN0Q2FsbGJhY2spXG4gICAgICAgIC5vZmYoKTtcblxuICAgICRpbnB1dC5rZXlkb3duKCk7XG4gICAgb2soIXRlc3RDYWxsYmFjay5jYWxsZWQsIFwiT2ZmIFdvcmtzXCIpO1xuXG4gICAga2V5RXZlbnQub24oKTtcbiAgICAkaW5wdXQua2V5ZG93bigpO1xuXG4gICAgb2sodGVzdENhbGxiYWNrLmNhbGxlZCwgXCJPbiBXb3Jrc1wiKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5kZXN0cm95JywgZnVuY3Rpb24oKSB7XG4gICAga2V5RXZlbnRcbiAgICAgICAgLmRvd24odGVzdENhbGxiYWNrKVxuICAgICAgICAuZGVzdHJveSgpO1xuXG4gICAgJGlucHV0LmtleWRvd24oKTtcbiAgICBvayghdGVzdENhbGxiYWNrLmNhbGxlZCwgXCJObyBDYWxsYmFja3MgRmlyZWRcIik7XG59KTtcblxudGVzdCgna2V5RXZlbnQuX2FkZCcsIGZ1bmN0aW9uKCkge1xuICAgIGtleUV2ZW50Ll9hZGQoJ2Rvd24nLCBmYWxzZSwgdGVzdENhbGxiYWNrKTtcblxuICAgICRpbnB1dC5rZXlkb3duKCk7XG4gICAgb2sodGVzdENhbGxiYWNrLmNhbGxlZCwgXCJBZGQgd2l0aG91dCBjb25kaXRpb25zIHdvcmtzLlwiKTtcblxuXG4gICAgLy9vayh0ZXN0Q2FsbGJhY2suY2FsbGVkLCBcIkFkZCB3aXRoIGNvbmRpdGlvbnMgd29ya3MuXCIpO1xufSk7XG5cblxuXG4vKioqIEtleSBDb25kaXRpb24gVGVzdGluZyAqKiovXG5cbm1vZHVsZShcIktleSBDb25kaXRpb25zXCIsIHtcbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHNhbmRib3ggICAgICAgICA9IHNpbm9uLnNhbmRib3guY3JlYXRlKCk7XG4gICAgICAgIHRlc3RDYWxsYmFjayAgICA9IHNpbm9uLnNweSgpO1xuICAgICAgICAkaW5wdXQgICAgICAgICAgPSAkKFwiI2lucHV0XCIpO1xuICAgICAgICBrZXlFdmVudCAgICAgICAgPSBrZXkoJGlucHV0KTtcbiAgICB9LFxuICAgIHRlYXJkb3duOiBmdW5jdGlvbigpIHtcbiAgICAgICAga2V5LnVuYmluZEFsbCgpO1xuICAgIH1cbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zIE1vZGlmaWVycycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnc2hpZnQgYScpO1xuICAgIG9rKGNvbmRpdGlvbnMuc2hpZnQsIFwiU2hpZnQgTW9kaWZpZXJcIik7XG4gICAgXG4gICAgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ2FsdCBhJyk7XG4gICAgb2soY29uZGl0aW9ucy5hbHQsIFwiQWx0IE1vZGlmaWVyXCIpO1xuXG4gICAgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ2N0cmwgYScpO1xuICAgIG9rKGNvbmRpdGlvbnMuY3RybCwgXCJDdHJsIE1vZGlmaWVyXCIpO1xuXG4gICAgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ0FMVCBhJyk7XG4gICAgb2soY29uZGl0aW9ucy5hbHQsIFwiVVBQRVJDQVNFIE1vZGlmaWVyc1wiKTtcblxuICAgIGNvbmRpdGlvbnMgPSBrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zKCdhbHQtYScpO1xuICAgIG9rKGNvbmRpdGlvbnMuYWx0LCBcIkRhc2ggU2VwYXJhdG9yc1wiKTtcblxuICAgIGNvbmRpdGlvbnMgPSBrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zKCdjdHJsIHNoaWZ0IGFsdCBhJyk7XG4gICAgb2soY29uZGl0aW9ucy5hbHQgJiYgY29uZGl0aW9ucy5zaGlmdCAmJiBjb25kaXRpb25zLmN0cmwsIFwiTXVsdGlwbGUgbW9kaWZpZXJzIHdvcmtcIik7XG5cbiAgICBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnY21kIGEnKTtcbiAgICBvayhjb25kaXRpb25zLmN0cmwsIFwiY21kIGFsaWFzZXMgY3RybFwiKTtcbn0pO1xuXG50ZXN0KCdrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zIGtleXMnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ2EnKTtcbiAgICBlcXVhbChjb25kaXRpb25zLmtleSwgXCJhXCIsIFwiUmVjb2duaXplcyBvbmUgY2hhcmFjdGVyLlwiKTtcblxuICAgIGNvbmRpdGlvbnMgPSBrZXlFdmVudC5fcGFyc2VDb25kaXRpb25zKCdiYWNrc3BhY2UnKTtcbiAgICBlcXVhbChjb25kaXRpb25zLmtleSwgXCJiYWNrc3BhY2VcIiwgXCJSZWNvZ25pemVzIGxvbmdlciB3b3Jkcy5cIik7XG5cbiAgICBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnc2hpZnQgYmFja3NwYWNlJyk7XG4gICAgZXF1YWwoY29uZGl0aW9ucy5rZXksIFwiYmFja3NwYWNlXCIsIFwiSWdub3JlcyBtb2RpZmllcnMuXCIpO1xuXG4gICAgY29uZGl0aW9ucyA9IGtleUV2ZW50Ll9wYXJzZUNvbmRpdGlvbnMoJ3NoaWZ0Jyk7XG4gICAgZXF1YWwoY29uZGl0aW9ucy5rZXksIFwic2hpZnRcIiwgXCJVc2VzIG1vZGlmaWVyIGFzIGtleSBpZiBubyBvdGhlciBrZXkgaXMgcHJvdmlkZWRcIik7XG5cbiAgICBjb25kaXRpb25zID0ga2V5RXZlbnQuX3BhcnNlQ29uZGl0aW9ucygnJyk7XG4gICAgb2soIWNvbmRpdGlvbnMua2V5ICYmICFjb25kaXRpb25zLmtleUNvZGUgJiYgIWNvbmRpdGlvbnMuYWx0ICYmICFjb25kaXRpb25zLnNoaWZ0ICYmICFjb25kaXRpb25zLmN0cmwsIFwiRW1wdHkgcmV0dXJucyBhbGwgZmFsc2VcIik7XG59KTtcblxudGVzdCgna2V5RXZlbnQuX2tleUNvZGVUZXN0JywgZnVuY3Rpb24oKSB7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdhJywgNjUpLCBcIlN0YW5kYXJkIGxvd2VyY2FzZSBsZXR0ZXIga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnQScsIDY1KSwgXCJTdGFuZGFyZCB1cHBlcmNhc2UgbGV0dGVyIGtleVwiKTtcbiAgICBvaygha2V5RXZlbnQuX2tleUNvZGVUZXN0KCdBJywgNjgpLCBcIldyb25nIGxldHRlciBrZXlcIik7XG4gICAgb2soIWtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnYXZuYXNkJywgNjUpLCBcIlVuZGVmaW5lZCBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdjdHJsJywgMTcpLCBcIkN0cmwga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnY29udHJvbCcsIDE3KSwgXCJjb21tYW5kIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ2NtZCcsIDkxKSwgXCJDbWQga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnY29tbWFuZCcsIDkxKSwgXCJjb21tYW5kIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJzUnLCA1MyksIFwiTnVtYmVyIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ2AnLCAxOTIpLCBcImAga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnYmFja3NwYWNlJywgOCksIFwiYmFja3NwYWNlIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ0JBQ0tTUEFDRScsIDgpLCBcIkJBQ0tTUEFDRSBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdkZWxldGUnLCA0NiksIFwiZGVsZXRlIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJ2VudGVyJywgMTMpLCBcImVudGVyIGtleSAoMTMpXCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgnZW50ZXInLCAxMCksIFwiZW50ZXIga2V5ICgxMClcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KCdyZXR1cm4nLCAxMyksIFwicmV0dXJuIGtleSAoMTMpXCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdCgncmV0dXJuJywgMTApLCBcInJldHVybiBrZXkgKDEwKVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoJy4nLCAxOTApLCBcIi4ga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdChcIidcIiwgMjIyKSwgXCInIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoXCJbXCIsIDIxOSksIFwiWyBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KFwiXVwiLCAyMjEpLCBcIl0ga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdChcImYxXCIsIDExMiksIFwiZjEga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdChcIkYyXCIsIDExMyksIFwiRjIga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdChcIi1cIiwgMTg5KSwgXCItIGtleVwiKTtcbiAgICBvayhrZXlFdmVudC5fa2V5Q29kZVRlc3QoXCI9XCIsIDE4NyksIFwiPSBrZXlcIik7XG4gICAgb2soa2V5RXZlbnQuX2tleUNvZGVUZXN0KFwiZXNjXCIsIDI3KSwgXCJlc2Mga2V5XCIpO1xuICAgIG9rKGtleUV2ZW50Ll9rZXlDb2RlVGVzdChcInNwYWNlXCIsIDMyKSwgXCJzcGFjZSBrZXlcIik7XG59KTtcblxudGVzdCgna2V5RXZlbnQuX3ZhbGlkYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgb2soXG4gICAgICAgIGtleUV2ZW50Ll92YWxpZGF0ZSh7XG4gICAgICAgICAgICBrZXk6ICAgICAgICAnYScsXG4gICAgICAgICAgICBzaGlmdDogICAgICBmYWxzZSxcbiAgICAgICAgICAgIGFsdDogICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgY3RybDogICAgICAgZmFsc2VcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgd2hpY2g6ICAgICAgNjUsXG4gICAgICAgICAgICBzaGlmdEtleTogICBmYWxzZSxcbiAgICAgICAgICAgIGFsdEtleTogICAgIGZhbHNlLFxuICAgICAgICAgICAgbWV0YUtleTogICAgZmFsc2VcbiAgICAgICAgfSksXG4gICAgICAgIFwiJ2EnIGtleVwiXG4gICAgKTtcblxuICAgIG9rKFxuICAgICAgICAha2V5RXZlbnQuX3ZhbGlkYXRlKHtcbiAgICAgICAgICAgIGtleTogICAgICAgICdhJyxcbiAgICAgICAgICAgIHNoaWZ0OiAgICAgIGZhbHNlLFxuICAgICAgICAgICAgYWx0OiAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBjdHJsOiAgICAgICBmYWxzZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICB3aGljaDogICAgICA2NSxcbiAgICAgICAgICAgIHNoaWZ0S2V5OiAgIHRydWUsXG4gICAgICAgICAgICBhbHRLZXk6ICAgICBmYWxzZSxcbiAgICAgICAgICAgIG1ldGFLZXk6ICAgIGZhbHNlXG4gICAgICAgIH0pLFxuICAgICAgICBcIm5vdCAnYScga2V5XCJcbiAgICApO1xuXG4gICAgb2soXG4gICAgICAgIGtleUV2ZW50Ll92YWxpZGF0ZSh7XG4gICAgICAgICAgICBrZXk6ICAgICAgICAnY21kJyxcbiAgICAgICAgICAgIHNoaWZ0OiAgICAgIGZhbHNlLFxuICAgICAgICAgICAgYWx0OiAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBjdHJsOiAgICAgICBmYWxzZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICB3aGljaDogICAgICA5MSxcbiAgICAgICAgICAgIHNoaWZ0S2V5OiAgIGZhbHNlLFxuICAgICAgICAgICAgYWx0S2V5OiAgICAgZmFsc2UsXG4gICAgICAgICAgICBtZXRhS2V5OiAgICBmYWxzZVxuICAgICAgICB9KSxcbiAgICAgICAgXCJjbWQga2V5XCJcbiAgICApO1xuXG4gICAgb2soXG4gICAgICAgIGtleUV2ZW50Ll92YWxpZGF0ZSh7XG4gICAgICAgICAgICBrZXk6ICAgICAgICAnYicsXG4gICAgICAgICAgICBzaGlmdDogICAgICB0cnVlLFxuICAgICAgICAgICAgYWx0OiAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICBjdHJsOiAgICAgICB0cnVlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHdoaWNoOiAgICAgIDY2LFxuICAgICAgICAgICAgc2hpZnRLZXk6ICAgdHJ1ZSxcbiAgICAgICAgICAgIGFsdEtleTogICAgIGZhbHNlLFxuICAgICAgICAgICAgbWV0YUtleTogICAgZmFsc2UsXG4gICAgICAgICAgICBjdHJsS2V5OiAgICB0cnVlXG4gICAgICAgIH0pLFxuICAgICAgICBcImN0cmwtc2hpZnQtYlwiXG4gICAgKTtcblxuICAgIG9rKFxuICAgICAgICBrZXlFdmVudC5fdmFsaWRhdGUoe1xuICAgICAgICAgICAga2V5OiAgICAgICAgJ2InLFxuICAgICAgICAgICAgc2hpZnQ6ICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIGFsdDogICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgY3RybDogICAgICAgdHJ1ZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICB3aGljaDogICAgICA2NixcbiAgICAgICAgICAgIHNoaWZ0S2V5OiAgIHRydWUsXG4gICAgICAgICAgICBhbHRLZXk6ICAgICBmYWxzZSxcbiAgICAgICAgICAgIG1ldGFLZXk6ICAgIHRydWUsXG4gICAgICAgICAgICBjdHJsS2V5OiAgICBmYWxzZVxuICAgICAgICB9KSxcbiAgICAgICAgXCJjbWQtc2hpZnQtYlwiXG4gICAgKTtcbn0pO1xuXG5cbi8qKiogQ29uZGl0aW9uYWwgS2V5IEJpbmRpbmdzICoqKi9cbnZhciBlO1xubW9kdWxlKFwiQ29uZGl0aW9uYWwgS2V5IEJpbmRpbmdzXCIsIHtcbiAgICBzZXR1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHNhbmRib3ggICAgICAgICA9IHNpbm9uLnNhbmRib3guY3JlYXRlKCk7XG4gICAgICAgIHRlc3RDYWxsYmFjayAgICA9IHNpbm9uLnNweSgpO1xuICAgICAgICAkaW5wdXQgICAgICAgICAgPSAkKFwiI2lucHV0XCIpO1xuICAgICAgICBrZXlFdmVudCAgICAgICAgPSBrZXkoJGlucHV0KTtcblxuICAgICAgICBlID0gJC5FdmVudCgna2V5ZG93bicpO1xuICAgICAgICBlLndoaWNoICAgID0gbnVsbDtcbiAgICAgICAgZS5jdHJsS2V5ICA9IGZhbHNlO1xuICAgICAgICBlLmFsdEtleSAgID0gZmFsc2U7XG4gICAgICAgIGUubWV0YUtleSAgPSBmYWxzZTtcbiAgICAgICAgZS5zaGlmdEtleSA9IGZhbHNlO1xuICAgIH0sXG4gICAgdGVhcmRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICBrZXkudW5iaW5kQWxsKCk7XG4gICAgfVxufSk7XG5cbnRlc3QoJ2dsb2JhbCBrZXkgY29kZScsIGZ1bmN0aW9uKCkge1xuICAgIGtleS5kb3duKHtcbiAgICAgICAgJ2N0cmwtYSc6IHRlc3RDYWxsYmFja1xuICAgIH0pO1xuXG4gICAgZS53aGljaCAgICA9IDY1O1xuICAgIGUuY3RybEtleSAgPSB0cnVlO1xuXG4gICAgJCh3aW5kb3cpLnRyaWdnZXIoZSk7XG5cbiAgICBvayh0ZXN0Q2FsbGJhY2suY2FsbGVkKTtcbn0pO1xuXG50ZXN0KCdET00gZWxlbWVudCBrZXkgY29kZScsIGZ1bmN0aW9uKCkge1xuICAgIGtleUV2ZW50LmRvd24oe1xuICAgICAgICAnY3RybC1hJzogdGVzdENhbGxiYWNrXG4gICAgfSk7XG5cbiAgICBlLndoaWNoICAgID0gNjU7XG4gICAgZS5jdHJsS2V5ICA9IHRydWU7XG5cbiAgICAkaW5wdXQudHJpZ2dlcihlKTtcblxuICAgIG9rKHRlc3RDYWxsYmFjay5jYWxsZWQpO1xufSk7XG5cbnRlc3QoJ2dsb2JhbCBrZXkgY29kZSBubyBtYXRjaCcsIGZ1bmN0aW9uKCkge1xuICAgIGtleS5kb3duKHtcbiAgICAgICAgJ2N0cmwtc2hpZnQtYSc6IHRlc3RDYWxsYmFja1xuICAgIH0pO1xuXG4gICAgZS53aGljaCAgICA9IDY1O1xuICAgIGUuY3RybEtleSAgPSB0cnVlO1xuXG4gICAgJCh3aW5kb3cpLnRyaWdnZXIoZSk7XG5cbiAgICBvayghdGVzdENhbGxiYWNrLmNhbGxlZCk7XG59KTtcblxudGVzdCgnY21kIGtleSBtYXRjaGVzIGN0cmwga2V5JywgZnVuY3Rpb24oKSB7XG4gICAga2V5LmRvd24oe1xuICAgICAgICAnY21kLXNoaWZ0LWEnOiB0ZXN0Q2FsbGJhY2tcbiAgICB9KTtcblxuICAgIGUud2hpY2ggICAgPSA2NTtcbiAgICBlLmN0cmxLZXkgID0gdHJ1ZTtcbiAgICBlLnNoaWZ0S2V5ID0gdHJ1ZTtcblxuICAgICQod2luZG93KS50cmlnZ2VyKGUpO1xuXG4gICAgb2sodGVzdENhbGxiYWNrLmNhbGxlZCk7XG59KTtcblxudGVzdCgnc2hpZnQgYmluZGluZycsIGZ1bmN0aW9uKCkge1xuICAgIGtleS5kb3duKHtcbiAgICAgICAgJ3NoaWZ0JzogdGVzdENhbGxiYWNrXG4gICAgfSk7XG5cbiAgICBlLndoaWNoID0gMTY7XG5cbiAgICAkKHdpbmRvdykudHJpZ2dlcihlKTtcblxuICAgIG9rKHRlc3RDYWxsYmFjay5jYWxsZWQpO1xufSk7XG5cblxuIl19
