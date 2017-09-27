/* eslint wrap-iife: ["error", "any"] */

import { createMIDIAccess, closeAllMIDIInputs } from './midi/midi_access';
import { polyfill, getDevice } from './util/util';

let midiAccess;

(() => {
    //    if (!navigator.requestMIDIAccess) {
    polyfill();
    navigator.requestMIDIAccess = () => {
        // singleton-ish, no need to create multiple instances of MIDIAccess
        if (midiAccess === undefined) {
            midiAccess = createMIDIAccess();
        }
        return midiAccess;
    };
    if (getDevice().nodejs === true) {
        navigator.close = () => {
            // Need to close MIDI input ports, otherwise Node.js will wait for MIDI input forever.
            closeAllMIDIInputs();
        };
    }
    //    }
})();
