// This script is for Node.js only. Don't use it in HTML!
global.navigator = {
    node: true,
};

require('../dist/index.js');

const jazzMidi = require('jazz-midi');

global.window = {
    setTimeout,
    jazzMidi,
};

