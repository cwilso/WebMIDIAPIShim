'use strict';

var _midi_access = require('./midi/midi_access');

var _util = require('./util/util');

var _midi_input = require('./midi/midi_input');

var _midi_output = require('./midi/midi_output');

var _midimessage_event = require('./midi/midimessage_event');

var midiAccess = void 0;

var init = function init() {
    if (!navigator.requestMIDIAccess) {
        // Add some functionality to older browsers
        (0, _util.polyfill)();

        // Add WebMIDI API globals
        global.MIDIInput = _midi_input.MIDIInput;
        global.MIDIOutput = _midi_output.MIDIOutput;
        global.MIDIMessageEvent = _midimessage_event.MIDIMessageEvent;

        navigator.requestMIDIAccess = function () {
            // Singleton-ish, no need to create multiple instances of MIDIAccess
            if (midiAccess === undefined) {
                midiAccess = (0, _midi_access.createMIDIAccess)();
            }
            return midiAccess;
        };
        if ((0, _util.getDevice)().nodejs === true) {
            navigator.close = function () {
                // For Nodejs applications we need to add a method that closes all MIDI input ports,
                // otherwise Nodejs will wait for MIDI input forever.
                (0, _midi_access.closeAllMIDIInputs)();
            };
        }
    }
};

init();
//# sourceMappingURL=index.js.map