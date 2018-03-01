'use strict';

var _midi_access = require('./midi/midi_access');

var _util = require('./util/util');

var _midi_input = require('./midi/midi_input');

var Input = _interopRequireWildcard(_midi_input);

var _midi_output = require('./midi/midi_output');

var Output = _interopRequireWildcard(_midi_output);

var _midimessage_event = require('./midi/midimessage_event');

var _midimessage_event2 = _interopRequireDefault(_midimessage_event);

var _midiconnection_event = require('./midi/midiconnection_event');

var _midiconnection_event2 = _interopRequireDefault(_midiconnection_event);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// import MIDIInput from './midi/midi_input';
// import MIDIOutput from './midi/midi_output';
var midiAccess = void 0;

var init = function init() {
    if (!navigator.requestMIDIAccess) {
        // Add some functionality to older browsers
        (0, _util.polyfill)();

        navigator.requestMIDIAccess = function () {
            // Singleton-ish, no need to create multiple instances of MIDIAccess
            if (midiAccess === undefined) {
                midiAccess = (0, _midi_access.createMIDIAccess)();
                // Add global vars that mimic WebMIDI API native globals
                var scope = (0, _util.getScope)();
                scope.MIDIInput = Input;
                scope.MIDIOutput = Output;
                scope.MIDIMessageEvent = _midimessage_event2.default;
                scope.MIDIConnectionEvent = _midiconnection_event2.default;
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