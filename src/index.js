import { createMIDIAccess, closeAllMIDIInputs } from './midi/midi_access';
import { polyfill, getDevice } from './util/util';

let midiAccess;

const init = () => {
    if (!navigator.requestMIDIAccess) {
        // Add some functionality to older browsers
        polyfill();
        navigator.requestMIDIAccess = () => {
            // Singleton-ish, no need to create multiple instances of MIDIAccess
            if (midiAccess === undefined) {
                midiAccess = createMIDIAccess();
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
