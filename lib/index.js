// This script is for Node.js only. Don't use it in HTML!
var window = {
  jazzMidi: require('jazz-midi'),
  navigator: module.exports,
  setTimeout: setTimeout,
  performance: {
    now: require("performance-now")
  }
};
eval(require('fs').readFileSync(require('path').join(__dirname, 'WebMIDIAPI.js'))+'');
