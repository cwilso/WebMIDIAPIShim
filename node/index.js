const jazzMidi = require('jazz-midi');
// create a global navigator object in the Node environment
global.navigator = {
    node: true,
    jazzMidi,
};

require('../dist/index.js');
