import { createMIDIAccess, closeAllMIDIInputs } from './midi/midi_access';
import { polyfill, getDevice, getScope } from './util/util';
// import MIDIInput from './midi/midi_input';
// import MIDIOutput from './midi/midi_output';
import * as Input from './midi/midi_input';
import * as Output from './midi/midi_output';
import MIDIMessageEvent from './midi/midimessage_event';
import MIDIConnectionEvent from './midi/midiconnection_event';

let midiAccess;

const init = () => {
    if (!navigator.requestMIDIAccess) {
        // Add some functionality to older browsers
        polyfill();

        navigator.requestMIDIAccess = () => {
            // Singleton-ish, no need to create multiple instances of MIDIAccess
            if (midiAccess === undefined) {
                midiAccess = createMIDIAccess();
                // Add global vars that mimic WebMIDI API native globals
                const scope = getScope();
                scope.MIDIInput = Input;
                scope.MIDIOutput = Output;
                scope.MIDIMessageEvent = MIDIMessageEvent;
                scope.MIDIConnectionEvent = MIDIConnectionEvent;
            }
            return midiAccess;
        };
        if (getDevice().nodejs === true) {
            navigator.close = () => {
                // For Nodejs applications we need to add a method that closes all MIDI input ports,
                // otherwise Nodejs will wait for MIDI input forever.
                closeAllMIDIInputs();
            };
        }
    }
};

init();
