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
var $ = _dereq_('unopinionate').selector;

var $document = $(window);

var Event = function(selector) {
    this.selector   = selector;
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
        this.$scope.unbind('keydown keyup');
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
        return {
            //key:    ,
            shift:   /\bshift\b/i.test(c),
            alt:     /\balt\b/i.test(c),
            ctrl:    /\bctrl\b/i.test(c),
            noMeta:  /\bnoMeta\b/i.test(c)
        };
    },
    _validate: function(c, e) {
        return  c.key ? c.key === e.which : true &&
                c.shift === e.shiftKey &&
                c.alt   === e.altKey &&
                ((c.ctrl === e.metaKey) !== (c.ctrl === e.ctrlKey)) &&
                (c.noMeta ? !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey : true);
    }
};

module.exports = Event;
},{"unopinionate":1}],3:[function(_dereq_,module,exports){
var Event = _dereq_('./Event.js'),
    events = [];

var key = function(selector) { //Factory for Event objects
    var event = key._createEvent(selector);
    events.push(event);
    return event;
};

key.down = function(config) {
    var event = this._createEvent().down(config);
    events.push(event);
    return event;
};

key.up = function(config) {
    var event = this._createEvent().up(config);
    events.push(event);
    return event;
};

key.unbindAll = function() {
    var i = events.length;
    while(i--) {
        events[i].destroy();
    }
};

//Creates new Event objects (checking for existing first)
key._createEvent = function(selector) {
    var i = events.length;
    while(i--) {
        if(events[i].selector == selector) {
            return events[i];
        }
    }

    return new Event(selector);
};

module.exports = key;

},{"./Event.js":2}]},{},[3])
(3)
});