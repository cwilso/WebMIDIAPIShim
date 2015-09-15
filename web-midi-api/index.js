// This script is for Node.js only. Don't use it in HTML!

'use strict';

var jazzMidi = require('jazz-midi');
var performance = {
  now: require('performance-now')
};
var navigator = {nodejs: true};

eval(require('fs').readFileSync(require('path').join(__dirname, 'WebMIDIAPI.min.js')) + '');

module.exports = navigator;