var Event = require('./Event.js'),
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
