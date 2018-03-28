// Main entry point for Nodejs applications, includes jazz-midi npm package as a replacement
// of the browsers' native WebMIDI implementation or the Jazz MIDI browser plugin.

const jazzMidi = require('jazz-midi');
global.navigator = {
    node: true,
    jazzMidi,
};
require('../dist/index.js');
exports.requestMIDIAccess = navigator.requestMIDIAccess;
exports.MIDIInput = navigator.MIDIInput;
exports.MIDIOutput = navigator.MIDIOutput;
exports.MIDIMessageEvent = navigator.MIDIMessageEvent;
exports.MIDIConnectionEvent = navigator.MIDIConnectionEvent;
exports.close = navigator.close;
