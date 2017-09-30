// Main entry point for Nodejs applications, includes jazz-midi Nodejs module as a replacement
// of the browsers' native WebMIDI implementation or the JazzMIDI browser plugin.

const jazzMidi = require('jazz-midi');
global.navigator = {
    node: true,
    jazzMidi,
};

require('../dist/index.js');
