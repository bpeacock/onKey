Installation
------------

```bash
npm install
```

In addition jQuery-like selector library is required:
- jQuery 1.4.3+
- Zepto

Usage
-----

```javascript
//Bind a keydown & keyup event to the window
key
    .down(function(e) {
        alert("key down!");
    })
    .up(function(e) {
        alert("key up!")
    });

//Bind keyup to a specific selector (will also take DOM or jQuery object)
key('#input').down(function() {
    alert('input keydown');
});

//Bind key codes
key.down({
    'ctrl-alt-tab': function() {
        console.log('ctr-alt-tab pressed!');
    },
    'cmd-a': function() {
        console.log('cmd & ctrl are normalized so that hot-keys work consistently across operating systems');
    }
});

//An Event object is returned whenever key(), key.down() or key.up() is called.
//This object can be turned on and off and more key events can be bound to it.
//This is useful for apps where key events are only relevant in certain views.
var keyEvent = key('#input').down(function() {
    alert('boom!');
});

keyEvent.off();
//keyEvent won't fire

keyEvent.on();
//keyEvent will fire

keyEvent.up({
    'ctrl-a': function() {
        alert('Another binding to the same input!');
    }
});
```

Development
-----------

To Build: `grunt build`

To Develop: `grunt watch`

To Test: `npm test`
