var key = require("../src/main.js");

key.down(function(e) {
    console.log('this is a global keydown');
});

key($('input')).up(function(e) {
    console.log('this is a keydown in the input');
});
