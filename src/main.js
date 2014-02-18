var $ = require('jquery'),
    Event = require('./Event.js');

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
