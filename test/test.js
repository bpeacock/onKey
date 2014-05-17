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

test('this in a callback should be the key object itself', function() {
    var down = key.down(function() {
        deepEqual(down, this);
    });

    $(window).trigger(e);
});

