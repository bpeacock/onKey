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
        return  c.key ? c.key === e.which : true &&
                c.shift === e.shiftKey &&
                c.alt   === e.altKey &&
                ((c.ctrl === e.metaKey) !== (c.ctrl === e.ctrlKey)) &&
                (c.noMeta ? !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey : true);
    }
};

module.exports = Event;