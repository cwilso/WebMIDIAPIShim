/*
  This script is for Node.js, you can run it like so:
    - open a terminal
    - navigate to the folder that contains this file
    - run "npm install web-midi-api" to install the shim in the local directory
    - type "node test.js" in your terminal and press the enter key (on Linux type: "nodejs test.js")
*/

'use strict';

var navigator = require('web-midi-api');

var midi;
var inputs;
var outputs;

function onMIDIFailure(msg){
  console.log('Failed to get MIDI access - ' + msg);
  process.exit(1);
}

function onMIDISuccess(midiAccess){
  midi = midiAccess;
  inputs = midi.inputs;
  outputs = midi.outputs;
  setTimeout(testOutputs, 500);
}

function testOutputs(){
  console.log('Testing MIDI-Out ports...');
  outputs.forEach(function(port){
    console.log('id:', port.id, 'manufacturer:', port.manufacturer, 'name:', port.name, 'version:', port.version);
    port.send([0x90, 60, 0x7f]);
  });
  setTimeout(stopOutputs, 1000);
}

function stopOutputs(){
  outputs.forEach(function(port){
    port.send([0x80, 60, 0]);
  });
  testInputs();
}

function onMidiIn(ev){
  var arr = [];
  for(var i = 0; i < ev.data.length; i++){
    arr.push((ev.data[i] < 16 ? '0' : '') + ev.data[i].toString(16));
  }
  console.log('MIDI:', arr.join(' '));
}

function testInputs(){
  console.log('Testing MIDI-In ports...');
  inputs.forEach(function(port){
    console.log('id:', port.id, 'manufacturer:', port.manufacturer, 'name:', port.name, 'version:', port.version);
    port.onmidimessage = onMidiIn;
  });
  setTimeout(stopInputs, 5000);
}

function stopInputs(){
  console.log('Thank you!');
  navigator.close(); // This will close MIDI inputs, otherwise Node.js will wait for MIDI input forever.
  process.exit(0);
}

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);