// This script is for Node.js only. Don't use it in HTML!
const window = {};
window.jazzMidi = require('jazz-midi');

global.navigator = {
    nodejs: true,
};
window.setTimeout = setTimeout;

const { polyfill } = require('../dist/util/util.js');

polyfill();
// const shim = require('../browser/WebMIDIAPI.js');

// console.log(global.performance);
// console.log(global.performance);

// const shim = require('../dist/index.js');
// console.log(shim);

// module.exports = shim;

eval(`${require('fs').readFileSync(require('path').join(__dirname, '../browser/WebMIDIAPI.js'))}`);
