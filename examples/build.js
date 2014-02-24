(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var key = require("../src/main.js");

key.down(function(e) {
    console.log('this is a global keydown');
});

key($('input')).up(function(e) {
    console.log('this is a keydown in the input');
});
},{"../src/main.js":4}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
var $ = require('unopinionate').selector;

var $document = $(window);

var Event = function(selector) {
    this.$scope     = selector ? $(selector) : $document;
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

        if(!this.callbacks[type]) {
            this.callbacks[type] = [];

            this.$scope.bind('key' + type, function(e) {
                if(self.active) {
                    var callbacks = self.callbacks[type];

                    for(var i=0; i<events.length; i++) {
                        var callback = callbacks[i];

                        if(!callback.conditions || self._validate(callback.conditions, e)) {
                            callback(e);
                        }
                    }
                }
            });
        }
        
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
        this.$scope.unbind('keydown');
    },

    /*** Internal Functions ***/
    _add: function(type, conditions, callback) {
        if(conditions) {
            callback.conditions = this._parseConditions(conditions);
        }

        this.callbacks[type].push(callback);
    },
    _parseConditions: function(c) {
        return {
            //key:    ,
            shift:   /\bshift\b/i.test(c),
            alt:     /\balt\b/i.test(c),
            ctrl:    /\bctrl\b/i.test(c),
            noMeta:  /\bnoMeta\b/i.test(c)
        };
    },
    _validate: function(c, e) {
        return  c.key ? c.key == e.which : true &&
                c.shift == e.shiftKey &&
                c.alt   == e.altKey &&
                ((c.ctrl == e.metaKey) != (c.ctrl == e.ctrlKey)) &&
                (c.noMeta ? !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey : true);
    }
};

module.exports = Event;
},{"unopinionate":2}],4:[function(require,module,exports){
var Event = require('./Event.js');

var key = function(selector) { //Factory for Event objects
    return new Event(selector);
};

key.down = function(config) {
    return new Event().down(config);
};

key.up = function(config) {
    return new Event().up(config);
};

module.exports = key;

},{"./Event.js":3}]},{},[1])