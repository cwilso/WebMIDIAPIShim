/*
  This example shows you how you can use the WebMIDIAPIShim in your Nodejs projects.

  Follow these steps to run this test:
  - create a new folder for your project
  - open a terminal
  - cd to the newly created project folder
  - run 'npm install web-midi-api'
  - now a folder node_modules has been created
  - copy over this file to your project folder
  - type 'node main.js' and press enter (on Linux type: 'nodejs main.js')

  You can use the code in the example below as a starting point for your own code. You can organize your project files
  in any directory structure that suits your project best; nodejs will find the web-midi-api package in the
  node_modules folder.

  If you are new to npm and using npm modules in your project please visit the npm
  site: https://docs.npmjs.com/

 */

'use strict';


// create a navigator object, after this you can use the WebMIDIAPIShim like in a webproject
var navigator = require('web-midi-api');
var midiAccess;

navigator.requestMIDIAccess().then(

  function onFulfilled(access){
    midiAccess = access;

    // create list of all currently connected MIDI devices
    showMIDIPorts();

    // update the device list when devices get connected, disconnected, opened or closed
    midiAccess.onstatechange = function(){
      showMIDIPorts();
    };
  },

  function onRejected(e){
    console.log(e);
    process.exit(1);
  }
);


function showMIDIPorts(){
  console.log('midi inputs:');
  midiAccess.inputs.forEach(function(port){
    console.log(port.name + ' (' + port.state + ', ' +  port.connection + ')');
  });

  console.log('midi outputs:');
  midiAccess.outputs.forEach(function(port){
    port.open(); // open port so we can send MIDI data
    port.send([0x90, 60, 100]); // send a NOTE ON event right away
    port.send([0x80, 60, 0], 3000); // send a NOTE OFF event after 3 seconds
    console.log(port.name + ' (' + port.state + ', ' +  port.connection + ')');
  });
}