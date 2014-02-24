!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.onKey=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
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

},{}],2:[function(_dereq_,module,exports){
var $ = _dereq_('unopinionate').selector,
        specialKeys = _dereq_('./specialKeys');

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


},{"./specialKeys":4,"unopinionate":1}],3:[function(_dereq_,module,exports){
var Event = _dereq_('./Event.js'),
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

},{"./Event.js":2}],4:[function(_dereq_,module,exports){
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

},{}]},{},[3])
(3)
});