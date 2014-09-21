// This script is for Node.js only. Don't use it in HTML!
var window = {};
window.jazzMidi = require('jazz-midi');
window.navigator = module.exports;
window.setTimeout = setTimeout;
eval(require('fs').readFileSync(require('path').join(__dirname, 'WebMIDIAPI.js'))+'');
