// This script is for Node.js only. Don't use it in HTML!
'use strict';

var navigator = require('../web-midi-api');

var midi;
var inputs;
var outputs;

function onMIDIFailure(msg){
  console.log('Failed to get MIDI access - ' + msg);
}

function onMIDISuccess(midiAccess){
  midi = midiAccess;
  inputs = midi.inputs;
  outputs = midi.outputs;
  setTimeout(testOutputs, 500);
}

function testOutputs(){
  console.log('Testing MIDI-Out ports...');
  outputs.forEach(function(key, value){
    var x = value;
    console.log('id:', x.id, 'manufacturer:', x.manufacturer, 'name:', x.name, 'version:', x.version);
    x.send([0x90, 60, 0x7f]);
  });
  setTimeout(stopOutputs, 1000);
}

function stopOutputs(){
  outputs.forEach(function(key, value){
    value.send([0x80, 60, 0]);
  });
  testInputs();
}

function onMidiIn(ev){
  var arr = [];
  for(var i=0; i<ev.data.length; i++) arr.push((ev.data[i]<16 ? '0' : '') + ev.data[i].toString(16));
  console.log('MIDI:', arr.join(' '));
}

function testInputs(){
  console.log('Testing MIDI-In ports...');
  inputs.forEach(function(key, value){
    var x = value;
    console.log('id:', x.id, 'manufacturer:', x.manufacturer, 'name:', x.name, 'version:', x.version);
    x.onmidimessage = onMidiIn;
  });
  setTimeout(stopInputs, 5000);
}

function stopInputs(){
  console.log('Thank you!');
  navigator.close(); // This will close MIDI inputs, otherwise Node.js will wait for MIDI input forever.
}

navigator.requestMIDIAccess().then(onMIDISuccess,onMIDIFailure);